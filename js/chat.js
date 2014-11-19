var chat = {};

chat.socket = io.connect(window.location.origin);

chat.userName = '';

chat.chatWindow = Backbone.View.extend({
	el: '.chat-window',
	messageTemplate: _.template($('#message-template').html()),
	disconnectTemplate: _.template($('#disconnect-template').html()),
	connectedTemplate: _.template($('#connected-template').html()),
	initialize: function() {
		this.setUserName();
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
	setUserName: function() {
		chat.userName = prompt("Enter User Name: ");
		this.createConnection();
		return this;
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
//Message Bar 
chat.messageBar = Backbone.View.extend({
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

chat.events = function() {
	$(window).on('unload', function() {
		var message = {};
		message.time = new Date();
		message.message = "User Disconnected";
		chat.socket.emit('disconnected', message);
	});
};

chat.init = function() {
	var messageBar = new chat.messageBar();
	var chatWindow = new chat.chatWindow();
	chat.events();
};

$(function() {
	chat.init();
});	
