"""Constants for the Netease Lyrics integration."""
DOMAIN = "netease_lyrics"
NAME = "Netease Lyrics"

CONF_SOURCE = "source"
DEFAULT_SOURCE = "qq"
SOURCES = {
    "wy": "网易云音乐",
    "qq": "QQ音乐"
}

NETEASE_SEARCH_URL = "http://music.163.com/api/search/get"
NETEASE_LYRIC_URL = "http://music.163.com/api/song/lyric"
QQ_API_URL = "https://u.y.qq.com/cgi-bin/musicu.fcg"

QQ_SEARCH_URL = "https://c.y.qq.com/soso/fcgi-bin/client_search_cp"
QQ_LYRIC_URL = "https://c.y.qq.com/lyric/fcgi-bin/fcg_query_lyric_new.fcg" 