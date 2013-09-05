CREATE TABLE `plog_keys` (
  `id` int(10) NOT NULL auto_increment,
  `developer` varchar(16) NOT NULL default '',
  `url` varchar(255) NOT NULL default '',
  `key` varchar(255) NOT NULL,
  `inserttime` datetime default NULL,
  `state` int(10) NOT NULL default '0',
  PRIMARY KEY  (`id`),
  UNIQUE KEY `key` (`key`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8