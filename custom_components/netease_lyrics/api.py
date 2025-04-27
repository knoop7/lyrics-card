import logging #line:1
import json #line:2
import aiohttp #line:3
from aiohttp import web #line:4
from homeassistant .components .http import HomeAssistantView #line:5
from .const import DOMAIN ,CONF_SOURCE #line:6
_O0OO0O0OOO0OO0OO0 =logging .getLogger (__name__ )#line:8
class NeteaseLyricsView (HomeAssistantView ):#line:10
    url ="/api/netease_lyrics/lyrics"#line:11
    name ="api:netease_lyrics:lyrics"#line:12
    requires_auth =True #line:13
    def __init__ (OO0000O0O0OO0O00O ,OO0O0000OO0000O0O ):#line:15
        OO0000O0O0OO0O00O .hass =OO0O0000OO0000O0O #line:16
    async def get (O0O0O00O000O00O0O ,O000000000OO0OOOO ):#line:18
        try :#line:19
            O0OOO00OO00O00000 =O000000000OO0OOOO .query .get ("title","")#line:20
            OOO00O0O000OOOO00 =O000000000OO0OOOO .query .get ("artist","")#line:21
            if not O0OOO00OO00O00000 or not OOO00O0O000OOOO00 :#line:22
                return O0O0O00O000O00O0O .json_message ("Missing title or artist",status_code =400 )#line:23
            O0000OOOO000O0OOO =next ((OO00OOO00O0OOOO0O for OO00OOO00O0OOOO0O in O0O0O00O000O00O0O .hass .config_entries .async_entries (DOMAIN )),None )#line:25
            if not O0000OOOO000O0OOO :#line:26
                return O0O0O00O000O00O0O .json_message ("Integration not configured",status_code =400 )#line:27
            OO0O0O00O00O00000 =O0000OOOO000O0OOO .options .get (CONF_SOURCE ,O0000OOOO000O0OOO .data .get (CONF_SOURCE ))#line:29
            _O0OO0O0OOO0OO0OO0 .debug (f"Using music source: {OO0O0O00O00O00000}")#line:30
            OO00O00O0O0O00OOO =await O0O0O00O000O00O0O ._search_qq_lyrics (O0OOO00OO00O00000 ,OOO00O0O000OOOO00 )#line:32
            if OO00O00O0O0O00OOO :#line:33
                _O0OO0O0OOO0OO0OO0 .debug (f"Found lyrics in QQ Music for: {O0OOO00OO00O00000} - {OOO00O0O000OOOO00}")#line:34
                return web .json_response ({"lyrics":OO00O00O0O0O00OOO ,"source":"qq"})#line:35
            OO00O00O0O0O00OOO =await O0O0O00O000O00O0O ._search_netease_lyrics (O0OOO00OO00O00000 ,OOO00O0O000OOOO00 )#line:37
            if OO00O00O0O0O00OOO :#line:38
                _O0OO0O0OOO0OO0OO0 .debug (f"Found lyrics in Netease for: {O0OOO00OO00O00000} - {OOO00O0O000OOOO00}")#line:39
                return web .json_response ({"lyrics":OO00O00O0O0O00OOO ,"source":"netease"})#line:40
            return O0O0O00O000O00O0O .json_message ("Lyrics not found",status_code =404 )#line:42
        except Exception as OOO0OO0OOO0O00000 :#line:44
            _O0OO0O0OOO0OO0OO0 .error ("Error handling request: %s",str (OOO0OO0OOO0O00000 ))#line:45
            return O0O0O00O000O00O0O .json_message (f"Internal error: {str(OOO0OO0OOO0O00000)}",status_code =500 )#line:46
    def _clean_text (OOO0OO00000OOOOO0 ,OO00OO00OOOOOOOO0 ):#line:48
        OOOO0OO00O00O000O =OO00OO00OOOOOOOO0 .strip ()#line:49
        OOOOOO0000O00000O =OO00OO00OOOOOOOO0 .replace ("(","").replace (")","").replace ("[","").replace ("]","").replace ("（","").replace ("）","").strip ()#line:53
        O0000O00000000OO0 ={OOOO0OO00O00O000O ,OOOOOO0000O00000O ,OOOOOO0000O00000O .replace (" ",""),OOOOOO0000O00000O .split ('/')[0 ].strip (),OOOOOO0000O00000O .split ('-')[0 ].strip (),OOOOOO0000O00000O .split ('／')[0 ].strip (),OOOOOO0000O00000O .split ('_')[0 ].strip (),}#line:63
        return list (filter (None ,O0000O00000000OO0 ))#line:65
    async def _search_qq_lyrics (OO0000OOOO0OO0O00 ,OO0O000000O0O0OO0 ,O0OO0OOOO00O0O0O0 ):#line:67
        try :#line:68
            O0OO0OO0OOO0OOO00 =f"{OO0O000000O0O0OO0} {O0OO0OOOO00O0O0O0}"#line:69
            async with aiohttp .ClientSession ()as OOO0O0000OO000O00 :#line:70
                O00OOO0O00OO00000 ={"req_1":{"method":"DoSearchForQQMusicDesktop","module":"music.search.SearchCgiService","param":{"query":O0OO0OO0OOO0OOO00 ,"search_type":0 ,"num_per_page":10 ,"page_num":1 }}}#line:82
                async with OOO0O0000OO000O00 .post ("https://u.y.qq.com/cgi-bin/musicu.fcg",headers ={"Referer":"https://y.qq.com","User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"},json =O00OOO0O00OO00000 )as OOOOO00O000OOO0OO :#line:91
                    O00O0O0OOOOO000O0 =await OOOOO00O000OOO0OO .text (encoding ='utf-8')#line:92
                    O000O000O0O0OOO0O =json .loads (O00O0O0OOOOO000O0 )#line:93
                    if not O000O000O0O0OOO0O .get ("req_1",{}).get ("data",{}).get ("body",{}).get ("song",{}).get ("list"):#line:95
                        return None #line:96
                    O00000OOO0OOO0000 =O000O000O0O0OOO0O ["req_1"]["data"]["body"]["song"]["list"]#line:98
                    OOO00OOO000000000 =OO0000OOOO0OO0O00 ._find_best_match (O00000OOO0OOO0000 ,OO0O000000O0O0OO0 ,O0OO0OOOO00O0O0O0 )#line:99
                    if not OOO00OOO000000000 :#line:101
                        return None #line:102
                    O00OO0OO0O0OOO0O0 ={"req_1":{"method":"GetPlayLyricInfo","module":"music.musichallSong.PlayLyricInfo","param":{"songMID":OOO00OOO000000000 ["mid"],"format":"json"}}}#line:113
                    async with OOO0O0000OO000O00 .post ("https://u.y.qq.com/cgi-bin/musicu.fcg",headers ={"Referer":"https://y.qq.com","User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"},json =O00OO0OO0O0OOO0O0 )as O00OO0OOO0O00O0OO :#line:122
                        O0O0000O000000OO0 =await O00OO0OOO0O00O0OO .text (encoding ='utf-8')#line:123
                        O00OO0OO0O0OOO0O0 =json .loads (O0O0000O000000OO0 )#line:124
                        if O00OO0OO0O0OOO0O0 .get ("req_1",{}).get ("data",{}).get ("lyric"):#line:126
                            import base64 #line:127
                            OOO0000OO0O0O00OO =O00OO0OO0O0OOO0O0 ["req_1"]["data"]["lyric"]#line:128
                            return base64 .b64decode (OOO0000OO0O0O00OO ).decode ('utf-8')#line:129
                        return None #line:131
        except Exception as O0OO0O0OOOO0O0O0O :#line:133
            _O0OO0O0OOO0OO0OO0 .error ("Error searching QQ lyrics: %s",str (O0OO0O0OOOO0O0O0O ))#line:134
            return None #line:135
    def _find_best_match (O0000O0OOOO0OO0OO ,OO0OOOOOO0000O0OO ,OO0O00O0OO0O000OO ,OOOOOO0OO0OOOO0OO ):#line:137
        O00OOOOOO00OOO00O =O0000O0OOOO0OO0OO ._clean_text (OO0O00O0OO0O000OO )#line:138
        OO0O00O0O0O0OO00O =O0000O0OOOO0OO0OO ._clean_text (OOOOOO0OO0OOOO0OO )#line:139
        for O0O000OO0OO0OO0O0 in OO0OOOOOO0000O0OO :#line:141
            O000OOO0OOOO0OO00 =O0O000OO0OO0OO0O0 ["name"].lower ()#line:142
            OO00O00OOOO0O0O00 =[O0OOO0O0OO0OOOOO0 ["name"].lower ()for O0OOO0O0OO0OOOOO0 in O0O000OO0OO0OO0O0 ["singer"]]#line:143
            for O0O00O0OOOO00O000 in O00OOOOOO00OOO00O :#line:146
                O0O00O0OOOO00O000 =O0O00O0OOOO00O000 .lower ()#line:147
                for OOOO000OOOO0OO0O0 in OO0O00O0O0O0OO00O :#line:148
                    OOOO000OOOO0OO0O0 =OOOO000OOOO0OO0O0 .lower ()#line:149
                    OO000000000O0O0OO =(O0O00O0OOOO00O000 in O000OOO0OOOO0OO00 or O000OOO0OOOO0OO00 in O0O00O0OOOO00O000 )#line:152
                    OOOOOOO0O00O0000O =any (OOOO000OOOO0OO0O0 in OOO000O000OO00O00 or OOO000O000OO00O00 in OOOO000OOOO0OO0O0 for OOO000O000OO00O00 in OO00O00OOOO0O0O00 )#line:158
                    if OO000000000O0O0OO and OOOOOOO0O00O0000O :#line:160
                        return O0O000OO0OO0OO0O0 #line:161
        for O0O000OO0OO0OO0O0 in OO0OOOOOO0000O0OO :#line:164
            O000OOO0OOOO0OO00 =O0O000OO0OO0OO0O0 ["name"].lower ()#line:165
            OO00O00OOOO0O0O00 =[O0O00O00O0O0OOOO0 ["name"].lower ()for O0O00O00O0O0OOOO0 in O0O000OO0OO0OO0O0 ["singer"]]#line:166
            if any (O0OOOOOOO0O0OO000 .lower ()in O000OOO0OOOO0OO00 for O0OOOOOOO0O0OO000 in O00OOOOOO00OOO00O )or any (OOO00OOO0O0O000O0 .lower ()in OOO00OOOOOO00OOOO for OOO00OOO0O0O000O0 in OO0O00O0O0O0OO00O for OOO00OOOOOO00OOOO in OO00O00OOOO0O0O00 ):#line:170
                return O0O000OO0OO0OO0O0 #line:171
        return OO0OOOOOO0000O0OO [0 ]if OO0OOOOOO0000O0OO else None #line:173
    async def _search_netease_lyrics (O0OOO0O0000O0OO0O ,O00OOOOO0OO0O00O0 ,OO000OO0OO0OOO0O0 ):#line:175
        try :#line:176
            O0O0000O0O000O00O =f"{O00OOOOO0OO0O00O0} {OO000OO0OO0OOO0O0}"#line:177
            async with aiohttp .ClientSession ()as O0000OO000O00OOOO :#line:178
                O0O0O0O0O0O0OOO0O ={"Accept":"application/json","User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36","Referer":"https://music.163.com","Origin":"https://music.163.com"}#line:184
                async with O0000OO000O00OOOO .get (f"http://music.163.com/api/search/get?s={O0O0000O0O000O00O}&type=1&limit=10",headers =O0O0O0O0O0O0OOO0O )as OO0O000OOOO00OOOO :#line:189
                    OO0OO00000000OO0O =await OO0O000OOOO00OOOO .text (encoding ='utf-8')#line:190
                    try :#line:191
                        OOOOO0OO0OO00OO0O =json .loads (OO0OO00000000OO0O )#line:192
                    except json .JSONDecodeError as O00OO000O00O000OO :#line:193
                        _O0OO0O0OOO0OO0OO0 .error ("Failed to parse search response: %s",OO0OO00000000OO0O )#line:194
                        return None #line:195
                    if not OOOOO0OO0OO00OO0O .get ("result",{}).get ("songs"):#line:197
                        return None #line:198
                    O0OOO000000O00OO0 =OOOOO0OO0OO00OO0O ["result"]["songs"]#line:200
                    OOO00OOOO00OO0000 =O0OOO0O0000O0OO0O ._find_best_match_netease (O0OOO000000O00OO0 ,O00OOOOO0OO0O00O0 ,OO000OO0OO0OOO0O0 )#line:201
                    if not OOO00OOOO00OO0000 :#line:203
                        return None #line:204
                    async with O0000OO000O00OOOO .get (f"http://music.163.com/api/song/lyric?id={OOO00OOOO00OO0000['id']}&lv=1&kv=1&tv=1",headers =O0O0O0O0O0O0OOO0O )as O000OOO0O0O0O0O0O :#line:209
                        OOO0O0000OO0O00O0 =await O000OOO0O0O0O0O0O .text (encoding ='utf-8')#line:210
                        try :#line:211
                            OOO0OO0O0OO00OOOO =json .loads (OOO0O0000OO0O00O0 )#line:212
                            return OOO0OO0O0OO00OOOO .get ("lrc",{}).get ("lyric")#line:213
                        except json .JSONDecodeError as O00OO000O00O000OO :#line:214
                            _O0OO0O0OOO0OO0OO0 .error ("Failed to parse lyrics response: %s",OOO0O0000OO0O00O0 )#line:215
                            return None #line:216
        except Exception as O00OO000O00O000OO :#line:218
            _O0OO0O0OOO0OO0OO0 .info ("Error searching Netease lyrics: %s",str (O00OO000O00O000OO ))#line:219
            return None #line:220
    def _find_best_match_netease (OOO00000O000O00OO ,OO00OO000O00O0000 ,OOO0OO0000O0O0OOO ,OOO0OO00OO00O0O00 ):#line:222
        OOO000OOOO0000OOO =OOO00000O000O00OO ._clean_text (OOO0OO0000O0O0OOO )#line:223
        OOOOO0000O00OO0OO =OOO00000O000O00OO ._clean_text (OOO0OO00OO00O0O00 )#line:224
        for OOO0000O0OO0OO0OO in OO00OO000O00O0000 :#line:226
            O0O0OOOO0OO0O0O0O =OOO0000O0OO0OO0OO ["name"].lower ()#line:227
            O0OOO0OOOO00OO00O =[OO000OOOOOO0OO0OO ["name"].lower ()for OO000OOOOOO0OO0OO in OOO0000O0OO0OO0OO ["artists"]]#line:228
            for O0O00000OO0000000 in OOO000OOOO0000OOO :#line:230
                O0O00000OO0000000 =O0O00000OO0000000 .lower ()#line:231
                for OO0OO0OO0O00OOO0O in OOOOO0000O00OO0OO :#line:232
                    OO0OO0OO0O00OOO0O =OO0OO0OO0O00OOO0O .lower ()#line:233
                    OOOO0000000O000OO =(O0O00000OO0000000 in O0O0OOOO0OO0O0O0O or O0O0OOOO0OO0O0O0O in O0O00000OO0000000 )#line:235
                    OOOOO0OOO00O0OOO0 =any (OO0OO0OO0O00OOO0O in O0O0O00OOO0O000O0 or O0O0O00OOO0O000O0 in OO0OO0OO0O00OOO0O for O0O0O00OOO0O000O0 in O0OOO0OOOO00OO00O )#line:240
                    if OOOO0000000O000OO and OOOOO0OOO00O0OOO0 :#line:242
                        return OOO0000O0OO0OO0OO #line:243
        for OOO0000O0OO0OO0OO in OO00OO000O00O0000 :#line:245
            O0O0OOOO0OO0O0O0O =OOO0000O0OO0OO0OO ["name"].lower ()#line:246
            O0OOO0OOOO00OO00O =[O000O0O0000000OOO ["name"].lower ()for O000O0O0000000OOO in OOO0000O0OO0OO0OO ["artists"]]#line:247
            if any (OO0000OOO0OO0O00O .lower ()in O0O0OOOO0OO0O0O0O for OO0000OOO0OO0O00O in OOO000OOOO0000OOO )or any (O0O0OO0OOO00O0O0O .lower ()in O0O0OO000OOO0OOOO for O0O0OO0OOO00O0O0O in OOOOO0000O00OO0OO for O0O0OO000OOO0OOOO in O0OOO0OOOO00OO00O ):#line:250
                return OOO0000O0OO0OO0OO #line:251
        return OO00OO000O00O0000 [0 ]if OO00OO000O00O0000 else None #line:253
