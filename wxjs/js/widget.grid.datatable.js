WXJS.UI.GRID.extend({
	'_sEcho': 0,

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
		this._sEcho++;

		return encodeURI('aoData=' + JSON.stringify(params));
	}
})