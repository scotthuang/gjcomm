WXJS.UI.GRID.extend({
	'_sEcho': 0,

	'_sSearch': '',

	'_generateData': function(data, map){
		var buff = [], tmp = '';
		var mapLength = map.length;
		for(var i = 0; i < data.length; i++){
			buff.push(['<tr class="', this._getConfig('id'), '_GridTr">'].join(''));

			for(var j = 0; j < data[i].length; j++){
				if(typeof map[j] != 'undefined'){
					if(typeof map[j]['renderer'] == 'function')
						tmp = (map[j]['renderer'])(data[i][j]);
					else
						tmp = data[i][j];

					buff.push(['<td class="', this._getConfig('id'), '_GridTd_', j, '">', tmp, '</td>'].join(''))
				}
			}

			buff.push('</tr>');
		}

		return buff.join('');
	},

	'getProQueryStr': function(){
		var sEcho = 0, //貌似是datatable按一下就+1，不知道有什么用
			iColumns = this._getConfig('map').length,
			iDisplayStart = (this._getConfig('currentPage') - 1) * this._getConfig('pageSize'),
			iDisplayLength = this._getConfig('pageSize'),
			params = [];

		params.push({'name': 'sEcho', 'value': this._sEcho}); //sEcho
		params.push({'name': 'iColumns', 'value': iColumns});
		params.push({'name': 'iDisplayStart', 'value': iDisplayStart});
		params.push({'name': 'iDisplayLength', 'value': iDisplayLength});
		params.push({'name': 'sSearch', 'value': this._sSearch})
		this._sEcho++;

		return encodeURI('aoData=' + JSON.stringify(params));
	},

	'_generateThead': function(map){
		var buff = [], tmp, sortStyle, sortSpecStyle = '',
			me = this,
			gridId = me._getConfig('id');

		for(var i = 0; i < map.length; i++){
			tmp = (typeof map[i]['name'] == 'undefined') ? map[i]['index'] : map[i]['name'];

			//加入表格头直接搜索
			if(typeof map[i]['search'] != 'undefined' && map[i]['search'] == true){
				tmp = [
					'<input data-index="', 
					map[i]['index'], 
					'" type="text" class="form-control ', gridId, '_SearchInput', '" style="display: inline-block; width: 75%;" placeholder="', 
					tmp, 
					'"/>'
				].join('');

				sortSpecStyle = 'wxSortText'; //这个是为了使排序框的高度适应不同的搜索组件的hack样式
			}else{
				sortSpecStyle = '';
			}

			sortStyle = (typeof map[i]['sort'] == 'undefined') ? '' : WXJS.UI.GRID._sortStyle;
			buff.push(
				['<th class="wxThead ', sortStyle, '" data-index="', map[i]['index'], '">'].join(''), 
				tmp
			);

			if(sortStyle) 
				buff.push(['<div class="wxSort ', sortSpecStyle, '"><span class="glyphicon ', WXJS.UI.GRID._sortUpIcon, ' ', WXJS.UI.GRID._displayDisable, '"></span><span class="glyphicon ', WXJS.UI.GRID._sortDownIcon, ' ', WXJS.UI.GRID._displayDisable, '"></span></div>'].join(''));

			buff.push('</th>');
		}

		return ['<thead><tr id="', this._getConfig('id') ,'_GridThead">', buff.join(''), '</tr></thead>'].join('');
	}
})

WXJS.UI.GRID.addAfter(function(grid){
	var key, value, condition = {'post': {}};
	//要重构，这里为了解决问题假如unbind，否则会绑定多次事件
	WXJS.TOOL.jq('.' + grid._getConfig('id') + '_SearchInput').unbind();
	WXJS.TOOL.jq('.' + grid._getConfig('id') + '_SearchInput').bind('keypress', function(e){
		if(e.keyCode == '13'){
			search(this);
		}
	})

	function search(obj){
		/*WXJS.TOOL.jq('.' + grid._getConfig('id') + '_SearchInput').each(function(){
			key = WXJS.TOOL.jq(this).attr('data-index');
			value = WXJS.TOOL.jq(this).val();

			condition['post'][key] = value;
			//特殊逻辑，为了兼顾现有后台
			grid._sSearch = value;
		})*/

		key = WXJS.TOOL.jq(obj).attr('data-index');
		value = WXJS.TOOL.jq(obj).val();
		grid._sSearch = value;

		grid.reload(condition, true);
	}
})