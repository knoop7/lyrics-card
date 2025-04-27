from __future__ import annotations

import logging
import os
import time
import shutil
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.components.frontend import add_extra_js_url

try:
    from homeassistant.components.http.static import StaticPathConfig
except ImportError:
    try:
        from homeassistant.components.http import StaticPathConfig
    except ImportError:
        class StaticPathConfig:
            def __init__(self, url_path, path, cache_headers):
                self.url_path = url_path
                self.path = path
                self.cache_headers = cache_headers

from .const import DOMAIN
from .api import NeteaseLyricsView

_LOGGER = logging.getLogger(__name__)

async def async_setup_lyrics_card(hass: HomeAssistant) -> bool:
    version = int(time.time())
    lyrics_card_path = '/netease_lyrics-local'
    
    try:
        await hass.http.async_register_static_paths([
            StaticPathConfig(
                lyrics_card_path, 
                hass.config.path('custom_components/netease_lyrics/frontend'), 
                False
            )
        ])
    except (AttributeError, TypeError) as e:
        _LOGGER.info("使用备用方法注册静态路径: %s", str(e))
        try:
            hass.http.register_static_path(
                lyrics_card_path,
                hass.config.path('custom_components/netease_lyrics/frontend'),
                False
            )
        except Exception as e:
            _LOGGER.info("无法注册静态路径: %s", str(e))
            return False
    
    _LOGGER.info("register_static_path: %s", lyrics_card_path)
    add_extra_js_url(hass, lyrics_card_path + f"/netease-lyrics-card.js?ver={version}")
    
    try:
        www_dir = hass.config.path("www")
        if not os.path.exists(www_dir):
            os.makedirs(www_dir)
        
        frontend_dir = hass.config.path('custom_components/netease_lyrics/frontend')
        js_src = os.path.join(frontend_dir, "netease-lyrics-card.js")
        js_dest = os.path.join(www_dir, "netease-lyrics-card.js")
        
        if os.path.exists(js_src):
            shutil.copy2(js_src, js_dest)
    except Exception as e:
        _LOGGER.info("复制文件到 www 目录失败: %s", str(e))
    
    return True

async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    hass.data.setdefault(DOMAIN, {})
    await async_setup_lyrics_card(hass)
    return True

async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    hass.data[DOMAIN][entry.entry_id] = entry.data

    hass.http.register_view(NeteaseLyricsView(hass))
    return True

async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    if DOMAIN in hass.data:
        hass.data[DOMAIN].pop(entry.entry_id)
    return True 
