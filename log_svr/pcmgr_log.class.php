<?php
	class Plog {
		//memcache配置
		private $_memcache;
		private $_mem_host = '1.1.1.1';
		private $_mem_port = 1;

		//buffer
		private $_cache_size = 0;
		private $_cache_chunk_size = 65536;

		//memcache key
		private $_key;
		private $_key_pre = 'PLOG@';
		private $_log;
		private $_refer;

		static $_instance = null;

		//数据库配置
		private $_DBHOST = '1.1.1.1';
		private $_DBUSER = 'user';
		private $_DBPASS = 'password';
		private $_DBNAME = 'db';

		private function __construct(){
			$this->_memcache = new Memcache;
			$this->_memcache->connect($this->_mem_host, $this->_mem_port);

			$this->_refer = (!empty($_SERVER['HTTP_REFERER'])) ? mysql_escape_string($_SERVER['HTTP_REFERER']) : '';

			//初始化生成这次log的key
			$this->init();
		}

		function __destruct(){
			$this->flush();
			$this->_memcache->close();
		}

		private function __clone(){}

		public static function getInstance(){
			if(!(self::$_instance instanceof self)){
				self::$_instance = new self();
			}

			return self::$_instance;
		} 

		public static function log($msg){
			$log = self::$_instance;

			if($log == null){
				$log = self::getInstance();
			}
			$log->append($msg);
		}

		private function append($msg){
			array_push($this->_log, $msg);
			$this->_cache_size += strlen($msg);

			if($this->_cache_size >= $this->_cache_chunk_size){
				$this->flush();
			}
		}

		private function flush(){
			$this->_memcache->set($this->_key, $this->_log, 0, 0);
		}

		private function getKey(){
			$key = $this->_key_pre . 'guanjia_default';

			if(!empty($this->_refer)){
				$tmp = parse_url($this->_refer);
				$key = $this->_key_pre . $tmp['host'] . '@' . str_replace('/', '@', trim($tmp['path'], "/"));
			}

			return $key;
		}

		private function saveKey(){
			mysql_connect($this->_DBHOST, $this->_DBUSER, $this->_DBPASS);
			mysql_select_db($this->_DBNAME);

			$sql = "insert into plog_keys(`url`, `key`, `inserttime`) values('{$this->_refer}', '{$this->_key}', '" . date('Y-m-d H:i:s') . "')";
			
			mysql_query($sql);
			mysql_close();
		}

		private function init(){
			$this->_key = $this->getKey();
			$this->_log = $this->_memcache->get($this->_key);
			
			if(FALSE === $this->_log || empty($this->_log)){
				$this->_log = array();
				$this->saveKey();
			}
		}

	}

?>