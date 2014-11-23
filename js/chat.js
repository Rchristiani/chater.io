var chat = {};

chat.siteUrl = (function() {
	var url = document.location.origin.split(':');
	if(url[2] === '4000') {
		return document.location.origin + ':4000';
	}
	else {
		return document.location.origin;
	}
});

chat.socket = io.connect(chat.siteUrl);

chat.userName = '';

chat.Router = Backbone.Router.extend({
	initialize: function() {
		Backbone.history.start();
		var header = new chat.Header();
		var messageBar = new chat.MessageBar();
		var login = new chat.Login();
	},
	routes: {
		'about' : 'about'
	},
	about: function() {
		var aboutView = new chat.AboutView();
	}
});

chat.Login = Backbone.View.extend({
	el: 'body',
	template: _.template($('#login-template').html()),
	events: {
		'submit .login-form' : 'createConnection'
	},
	initialize: function() {
		this.render();
	},
	render: function() {
		this.$el.append(this.template);
		this.$el.find('input[type="text"]').focus();
		return this;
	},
	createConnection: function(e) {
		var input = this.$el.find('.login-container input[type="text"]');
		e.preventDefault();
		chat.userName = input.val();
		if(chat.userName !== '') {
			var chatWindow = new chat.ChatWindow();
			this.$el.removeClass('show-login');
			this.undelegateEvents();
		}
		else {
			input.focus();
		}
	}
});

chat.ChatWindow = Backbone.View.extend({
	el: '.chat-window',
	messageTemplate: _.template($('#message-template').html()),
	disconnectTemplate: _.template($('#disconnect-template').html()),
	connectedTemplate: _.template($('#connected-template').html()),
	initialize: function() {
		this.createConnection();
	},
	createConnection: function() {
		var self = this;
		chat.socket.emit('connected', {time: new Date(), message: chat.userName + " connected"});
		chat.socket.on('newMessage', function(data) {
			self.renderMessage(data);
		});
		chat.socket.on('userConnect', function(data) {
			self.userConnect(data);
		});
		chat.socket.on('userDisconnect', function(data) {
			self.userDisconnect(data);
		});
	},
	renderMessage: function(message) {
		this.appendMessage(message, this.messageTemplate);
	},
	userConnect: function(message) {
		this.appendMessage(message,this.connectedTemplate);
	},
	userDisconnect: function(message) {
		this.appendMessage(message,this.disconnectTemplate);
	},
	appendMessage: function(message, template) {
		momentTime = moment(message.time,[moment.ISO_8601]);
		message.time = momentTime;
		this.$el.append(template(message));
		this.$el[0].scrollTop = this.$el[0].scrollHeight;
	}
});

chat.MessageBar = Backbone.View.extend({
	el: '.message-bar',
	template: _.template($('#message-bar').html()),
	events: {
		'submit form' : 'sendMessage' 
	},
	initialize: function() {
		this.render();
	},
	render: function() {
		this.$el.html(this.template);
		return this;
	},
	sendMessage: function(e) {
		e.preventDefault();
		var message = {};
		var $input = this.$el.find('input[type=text]');
		if($input.val() === '') {
			$input.focus();
		}
		else {
			message.message = $input.val();
			message.time = new Date();
			message.userName = chat.userName;
			$input.val('');
			chat.socket.emit('message', message);
		}
	}
});

chat.Header = Backbone.View.extend({
	el: '.main-header',
	template: _.template($('#header-template').html()),
	initialize: function() {
		this.render();
	},
	render: function() {
		this.$el.html(this.template);
	}
});

chat.AboutView = Backbone.View.extend({
	el: '.overlay',
	template: _.template($('#about-container').html()),
	events: {
		'click .close-btn' : 'closeView'
	},
	initialize: function() {
		this.render();
	},
	render: function() {
		this.$el.append(this.template);
		$('body').removeClass('show-login').addClass('show-info');
	},
	closeView: function(e) {
		e.preventDefault();
		if(chat.userName === '') {
			$('body').addClass('show-login');
		}
		this.undelegateEvents();
		this.$el.empty();
		$('body').removeClass('show-info');
		chat.router.navigate('/', {trigger: false});
	}
});

chat.events = function() {
	$(window).on('unload', function() {
		var message = {};
		message.time = new Date();
		message.message = chat.userName + " Disconnected";
		chat.socket.emit('disconnected', message);
	});
};

chat.init = function() {
	chat.router = new chat.Router();	
	chat.events();
};

$(function() {
	chat.init();
});	
