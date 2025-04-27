from __future__ import annotations

import voluptuous as vol
import sys
from homeassistant import config_entries
from homeassistant.core import callback
from homeassistant.data_entry_flow import FlowResult

from .const import DOMAIN, CONF_SOURCE, DEFAULT_SOURCE, SOURCES

try:
    from homeassistant.helpers.typing import ConfigType
    NEW_HOMEASSISTANT = True
except ImportError:
    NEW_HOMEASSISTANT = False

class NeteaseLyricsConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):

    VERSION = 1

    async def async_step_user(
        self, user_input=None
    ) -> FlowResult:
        if self._async_current_entries():
            return self.async_abort(reason="single_instance_allowed")

        if user_input is not None:
            return self.async_create_entry(
                title="歌词源",
                data=user_input
            )

        return self.async_show_form(
            step_id="user",
            data_schema=vol.Schema({
                vol.Required(CONF_SOURCE, default=DEFAULT_SOURCE): vol.In(SOURCES),
            })
        )

    async def async_step_import(self, import_info):
        return await self.async_step_user(import_info)

    @staticmethod
    @callback
    def async_get_options_flow(
        config_entry: config_entries.ConfigEntry,
    ):
        return NeteaseLyricsOptionsFlow(config_entry)


class NeteaseLyricsOptionsFlow(config_entries.OptionsFlow):

    def __init__(self, config_entry: config_entries.ConfigEntry) -> None:
        if NEW_HOMEASSISTANT:
            self._config_entry = config_entry  
            super().__init__()
        else:
            self.config_entry = config_entry

    async def async_step_init(
        self, user_input=None
    ):
        if user_input is not None:
            return self.async_create_entry(title="", data=user_input)

        config_entry = self._config_entry if NEW_HOMEASSISTANT else self.config_entry

        return self.async_show_form(
            step_id="init",
            data_schema=vol.Schema({
                vol.Required(
                    CONF_SOURCE,
                    default=config_entry.options.get(  
                        CONF_SOURCE, 
                        config_entry.data.get(CONF_SOURCE, DEFAULT_SOURCE)
                    ),
                ): vol.In(SOURCES),
            }),
        ) 
