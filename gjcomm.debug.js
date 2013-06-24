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

	//控制台引用
	_console: null,

	//console样式
	_cssTextBox: 'position:absolute; display: none; width: 480px; height: 320px; top: 30%; left:35%; border: 1px solid #000; padding:10px;',
	_cssTextBubble: 'font-size: 12px;',

	//console是否正在显示
	_consoleFlag: false,

	print: function(msg, type, sendFlag){
		var debugType = (typeof(type) == 'undefined') ? 'INFO' : type;

		var showType = this._typeInfo[this.TYPE[debugType]][1];

		//判断是否初始化
		if(!this._inited){
			this._init();
		}

		if(typeof(sendFlag) == 'boolean' && sendFlag == true){
			this._report(msg);
		}

		this._console.log(showType + ' ' + msg);
	},

	_init: function(){
		var me = this;
		//consoleBubble是个闭包变量，这样就不用每次去dom查找
		//this._console = window.console || function(){
		this._console = (function(){
			var consoleBubble = document.getElementById('consoleBubble');
			if(consoleBubble == null){
				//第一次创建的console容器
				var consoleFrag = document.createDocumentFragment();

				//容器具体元素
				var consoleBox = document.createElement('div');
				var consoleItem = document.createElement('div');
				var consoleClose = document.createElement('a');

				consoleBox.id = 'consoleBox';
				consoleBox.style.cssText = me._cssTextBox;

				consoleItem.id = 'consoleBubble';
				consoleItem.style.cssText = me._cssTextBubble;
				consoleClose.id = 'consoleClose';

				consoleBox.appendChild(consoleItem);
				consoleBox.appendChild(consoleClose);

				consoleFrag.appendChild(consoleBox);
				document.body.appendChild(consoleFrag);
				document.onkeydown = operateConsole;

				consoleBubble = document.getElementById('consoleBubble');
			}

			this._inited = true;
			return {
				log: log
			}

			function log(msg){
				var logItem = document.createElement('div');
				var logText = document.createTextNode(msg);

				logItem.appendChild(logText);
				consoleBubble.appendChild(logItem);
			}	

			function operateConsole(e){
				e = e || window.event;

				if(e.ctrlKey && e.keyCode == 88){
					//展示控制台
					toggleConsole();
				}

			}

			function toggleConsole(){
				var consoleBox = document.getElementById('consoleBox');
				if(!me._consoleFlag){
					consoleBox.style.display = 'block';
					me._consoleFlag = true;
				}else{
					consoleBox.style.display = 'none';
					me._consoleFlag = false;
				}
				consoleBox = null;
			}
		})();
	},

	_report: function(msg){

	}
};
