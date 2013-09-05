<?php
	class Plog_file {
		//数据库配置
		private $_DBHOST = '1.1.1.1';
		private $_DBUSER = 'user';
		private $_DBPASS = 'password';
		private $_DBNAME = 'db';

		//memcache配置
		private $_memcache;
		private $_mem_host = '1.1.1.1';
		private $_mem_port = 1;

		//日志存在基本路径
		private $_basedir = '/var/log/';

		//所有的key
		private $_keys;

		//日志日期
		private $_date;
		//日志名称
		private $_logname;

		public function __construct(){
			$this->_date = date('Y-m-d');
			$this->_logname = $this->_date . '.log';

			$this->_memcache = new Memcache;
			$this->_memcache->connect($this->_mem_host, $this->_mem_port);

			mysql_connect($this->_DBHOST, $this->_DBUSER, $this->_DBPASS);
			mysql_select_db($this->_DBNAME);

			$sql = 'select * from plog_keys';
			$res = mysql_query($sql);

			$this->_keys = array();

			while($row = mysql_fetch_assoc($res)){
				$this->_keys[] = $row['key'];
			}

			mysql_close();
		}

		function __destruct(){
			$this->_memcache->close();
		}

		public function main(){
			foreach($this->_keys as $key){
				$dir = $this->create_log_dir($key);
				$pathname = $dir . '/' . $this->_logname;

				$logs = $this->get_mem_data($key);
				$log = '';
				if(is_array($logs)){
					foreach($logs as $l){
						$log .= $l . "\r\n";
					}

					$this->write_to_file($log, $pathname);
				}
			}
		}

		private function write_to_file($log, $path){
			$h = fopen($path, 'a+');
			fwrite($h, $log);

			fclose($h);
		}

		private function get_mem_data($key){
			var_dump($key);
			$log = $this->_memcache->get($key);
			var_dump($log);
			//清空缓存
			$this->clear_cache($key);

			return $log;
		}

		private function clear_cache($key){
			$this->_memcache->set($key, '', 0, 0);
		}

		private function create_log_dir($key){
			$dirs = split("@", trim($key, 'PLOG@'));
			$path = $this->_basedir;
			foreach($dirs as $d){
				$path .= '/' . $d;

				if(!is_dir($path)){
					mkdir($path, '0777');
				}
			}

			return $path;
		}
	}

	$Plog_file = new Plog_file();
	$Plog_file->main();
?>