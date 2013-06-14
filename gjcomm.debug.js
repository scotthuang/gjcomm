var MGR = MGR || {};
MGR.debug = MGR.debug || {
	TYPE: {
		DEBUG : 0,
		ERROR : 1,
		WARNING : 2,
		INFO : 3,
		PROFILE : 4
	},

	_typeInfo: [
		["qzfl_log_debug", "√"], 
		["qzfl_log_error", "!"], 
		["qzfl_log_warning", "-"], 
		["qzfl_log_info", "i"], 
		["qzfl_log_profile", "└"]
	],

	//错误是否上报
	_errorSendFlag: false,

	//是否初始化
	_inited: false,

	print: function(msg, type, sendFlag){
		var me = this;
		var debugType = (typeof(type) == 'string') ? 'INFO' : type;
		var showType = me._typeInfo[type];

		var console = window.console || (function(){
			var consoleBubble = document.getElementById('consoleBubble');
			if(consoleBubble == null){
				//第一次创建的console容器
				var consoleFrag = document.createDocumentFragment();

				//容器具体元素
				var consoleBox = document.createElement('div');
				var consoleItem = document.createElement('div');
			}

			function log(){
				var logItem = document.createElement('span');
				var logText = document.createTextNode(showType + msg);

				logItem.appendChild(logText);
				consoleBubble.appendChild(logItem);
			}
		})();

		if(typeof(sendFlag) == 'boolean' && sendFlag == true){
			this._report(msg);
		}


	},

	_init: function(){

	},

	_report: function(msg){

	}
};
