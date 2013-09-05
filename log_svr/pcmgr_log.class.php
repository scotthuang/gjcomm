<?php
	class Plog {
		private $_memcache;
		private $_mem_host = '1.1.1.1';
		private $_mem_port = 1;

		private $_cache_size = 0;
		private $_cache_chunk_size = 65536;

		private $_key;
		private $_log;

		static $_instance = null;

		private function __construct(){
			$this->_memcache = new Memcache;
			$this->_memcache->connect($this->_mem_host, $this->_mem_port);

			//$this->_key = 'PLOG_' . basename(__FILE__, '.php');
			$this->_key = 'PLOG_URL_TEST';
			$this->_log = $this->_memcache->get($this->_key);

			if(FALSE === $this->_log){
				$this->_log = array();
			}
		}

		function __destruct(){
			$this->flush();
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
	}

?>