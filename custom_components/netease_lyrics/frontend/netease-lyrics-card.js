console.info("%c ♪ Lyrics %c v1.2.5","color: white; background: linear-gradient(90deg, #1DB954, rgb(29, 45, 185)); font-weight: bold; padding: 3px 6px; border-radius: 3px 0 0 3px; font-size: 10px; text-shadow: 0px 1px 0px rgba(0,0,0,0.2);","color: white; background: #333; font-weight: bold; padding: 3px 6px; border-radius: 0 3px 3px 0; font-size: 10px;");const fontUrlCache=new Map;import{LitElement,html,css,unsafeCSS}from"https://unpkg.com/lit-element@2.0.1/lit-element.js?module";const logger={info(t){console.log(`%c♪ %c${t}`,"color: #1DB954; font-weight: bold;","color: #666; font-style: italic;")},error(t){console.error(`%c♪ %c${t}`,"color: #f44336; font-weight: bold;","color: #f44336;")}};class NeteaseLyricsCard extends LitElement{static get properties(){return{hass:{type:Object},config:{type:Object},_lyrics:{type:Array},_currentIndex:{type:Number},_currentSong:{type:String},_currentArtist:{type:String},_musicSource:{type:String},_currentLyricProgress:{type:Number},_defaultDuration:{type:Number},_showBackground:{type:Boolean},style:{type:String,reflect:!0},_floatingPosition:{type:Object},_isDragging:{type:Boolean},_isInitialUpdate:{type:Boolean},_showSettings:{type:Boolean},_lyricsSettings:{type:Object},_repeatMode:{type:String},_useFixedHeight:{type:Boolean},_showFontSizeSlider:{type:Boolean},_lyricFontSize:{type:Number},_lyricFontSizeActive:{type:Number},_longPressTimer:{type:Object},_showArtistInfo:{type:Boolean},_lyricTimeOffset:{type:Number},_showAdjustButtons:{type:Boolean},_overrideTitle:{type:String},_overrideArtist:{type:String},_overrideAlbum:{type:String},_currentAlbumArt:{type:String},_overrideDuration:{type:Number}}}constructor(){super(),this._lyrics=[],this._currentIndex=-1,this._currentSong="",this._currentArtist="",this._overrideTitle=null,this._overrideArtist=null,this._overrideAlbum=null,this._currentAlbumArt=null,this._rafId=null,this._lastUpdateTime=0,this._lastScrollTime=0,this._currentLyricProgress=0,this._lyricsCache=new Map,this._initCache(),this._visibilityHandler=this._handleVisibilityChange.bind(this),document.addEventListener("visibilitychange",this._visibilityHandler),this._floatingPosition=this._loadPosition(),this._isDragging=!1,this._bindDragEvents(),this._bindTouchEvents(),this._isInitialUpdate=!0,this._showSettings=!1,this._lyricsSettings=this._loadLyricsSettings(),this._lyricsSettings.customFontUrl&&this._loadCustomFont(this._lyricsSettings.customFontUrl),this._bindSettingsEvents(),this._repeatMode=this._loadRepeatMode(),this._useFixedHeight=this._shouldUseFixedHeight(),this._showFontSizeSlider=!1,this._lyricFontSize=this._loadLyricFontSize(),this._lyricFontSizeActive=this._loadLyricFontSizeActive(),this._longPressTimer=null,this._bindLyricsFontSizeEvents(),this._toggleArtistInfoInterval=null,this._showArtistInfo=!0,this._lyricTimeOffset=this._loadLyricTimeOffset(),this._showAdjustButtons=!1,this._showAdjustTip=!1,this._adjustTipText="",this._adjustTipTimer=null,this._lastProgressUpdate=0,this._scrollRecoveryTimer=null,this._lastSuccessfulScroll=0,this._touchHideTimer=null,this._lastSuccessfulScroll=Date.now(),this._scrollHealthCheckInterval=setInterval((()=>{this._checkScrollHealth()}),5e3),this._overrideDuration=null,this._longPressTimeout=null,this._fontLoaded=!1,this._fontSizeSliderTimer=null,this._fontReady=!1,this._fontFacePromise=null}_checkFixedHeight(){try{const t=document.querySelector("home-assistant").shadowRoot.querySelector("home-assistant-main").shadowRoot.querySelector("partial-panel-resolver");if(t){const e=t.shadowRoot.querySelector("ha-panel-lovelace");this._useFixedHeight=e&&void 0!==e.lovelace}}catch(t){this._useFixedHeight=!1}}_initCache(){try{const t=localStorage.getItem("netease_lyrics_cache");if(t){const e=JSON.parse(t),i=Date.now();Object.keys(e).forEach((t=>{e[t].timestamp=i})),this._lyricsCache=new Map(Object.entries(e)),this._saveCache()}}catch(t){logger.error("初始化缓存失败:",t)}}_saveCache(){try{const t=Object.fromEntries(this._lyricsCache);localStorage.setItem("netease_lyrics_cache",JSON.stringify(t))}catch(t){logger.error("保存缓存失败:",t)}}setConfig(t){var e,i,s,r,o,n,a,c,l;if(!t.entity)throw new Error("请设置媒体播放器实体");let d=!1;try{const e=localStorage.getItem(`lyrics_container_state_${t.entity}`);if(e){const i=JSON.parse(e);Date.now()-i.timestamp<864e5?d=i.hidden:localStorage.removeItem(`lyrics_container_state_${t.entity}`)}}catch(t){logger.error("恢复歌词容器状态失败:",t)}const h=(void 0!==t.hide_lyrics_container?t.hide_lyrics_container:d)||void 0===t.hide_lyrics_container&&t.show_floating_lyrics;this.config={...t,show_background:null===(e=t.show_background)||void 0===e||e,show_header:null===(i=t.show_header)||void 0===i||i,show_karaoke:null===(s=t.show_karaoke)||void 0===s||s,show_floating_lyrics:null!==(r=t.show_floating_lyrics)&&void 0!==r&&r,hide_lyrics_container:h,show_player_name:null!==(o=t.show_player_name)&&void 0!==o&&o,grid_options:null!==(n=t.grid_options)&&void 0!==n?n:{columns:12,rows:6},view_layout:null!==(a=t.view_layout)&&void 0!==a?a:{},max_height:null!==(c=t.max_height)&&void 0!==c?c:450,lyric_font_size:null!==(l=t.lyric_font_size)&&void 0!==l?l:15},this._useFixedHeight=this._shouldUseFixedHeight(),this._lyricFontSize=this._loadLyricFontSize()||this.config.lyric_font_size,this._lyricFontSizeActive=this._loadLyricFontSizeActive()||this.config.lyric_font_size+2,this._toggleArtistInfoInterval=null,this._showArtistInfo=!0}updateCurrentLyricIndex(t){const e=t+this._lyricTimeOffset,i=Math.floor(1e3*e),s=performance.now();if(!this._isInitialUpdate&&s-this._lastUpdateTime<100)return;this._lastUpdateTime=s;let r=-1;const o=this._lyrics.length;for(let t=0;t<o;t++){this._lyrics[t];const e=this._lyrics[t+1];if(!e||i<e.time){r=t;break}}-1===r&&(r=this._lyrics.length-1),this._currentIndex!==r?(this._currentIndex=r,this._updateLyricProgress(i),requestAnimationFrame((()=>{this.updateScroll()}))):this._updateLyricProgress(i)}_updateLyricProgress(t){if(this._currentIndex<0)return;const e=this._lyrics[this._currentIndex],i=this._lyrics[this._currentIndex+1];if(e)if(i){const s=i.time-e.time;this._currentLyricProgress=Math.max(0,Math.min(1,(t-e.time)/s))}else this._currentLyricProgress=1}updateScroll(){try{const t=Date.now();if(t-this._lastScrollTime<100)return;const e=this.shadowRoot.querySelector(".lyrics-container"),i=this.shadowRoot.querySelector(".lyric.active");if(!e||!i||this._isDragging)return;const s=e.getBoundingClientRect(),r=i.getBoundingClientRect(),o=i.offsetTop-s.height/2+r.height/2,n=e.scrollTop;Math.abs(n-o)>5?requestAnimationFrame((()=>{try{e.scrollTo({top:o,behavior:this._isInitialUpdate?"auto":"smooth"}),this._lastSuccessfulScroll=t,this._lastScrollTime=t,this._isInitialUpdate&&(this._isInitialUpdate=!1)}catch(t){logger.error("歌词滚动失败:",t),e.scrollTop=o}})):(this._lastSuccessfulScroll=t,this._lastScrollTime=t)}catch(t){logger.error("歌词滚动更新失败:",t)}}async updated(t){if(t.has("hass")){const t=this.hass.states[this.config.entity];try{if(t){void 0!==t.attributes.shuffle&&t.attributes.repeat&&this._updateRepeatMode(t);const e=t.attributes.media_title,i=t.attributes.media_artist,s="playing"===t.state;if(e===this._currentSong&&i===this._currentArtist||(this._overrideTitle=null,this._overrideArtist=null,this._overrideAlbum=null,this._currentAlbumArt=null,this._overrideDuration=null),t.attributes.media_content_id&&t.attributes.media_content_id.includes("#INFO#")){const e=t.attributes.media_content_id.split("#INFO#");if(e.length>1){const t=e[1].split("#");if(logger.info(`从URL解析歌曲信息: ${JSON.stringify(t)}`),t.length>=4){if(this._overrideTitle=decodeURIComponent(t[0].replace(/^%/,"")),this._overrideArtist=decodeURIComponent(t[1].replace(/^%/,"")),this._overrideAlbum=decodeURIComponent(t[2].replace(/^%/,"")),this._currentAlbumArt=decodeURIComponent(t[3].replace(/^%/,"")),t.length>=5&&t[4]){const e=parseFloat(t[4]);!isNaN(e)&&e>0&&(this._overrideDuration=e,logger.info(`设置覆盖持续时间: ${this._overrideDuration}秒`))}logger.info(`设置覆盖信息: 歌曲="${this._overrideTitle}", 歌手="${this._overrideArtist}", 专辑="${this._overrideAlbum}", 封面="${this._currentAlbumArt}", 持续时间=${this._overrideDuration}`)}}}const r=this._overrideTitle||e,o=this._overrideArtist||i;if(r&&o&&(r!==this._currentSong||o!==this._currentArtist)){logger.info(`歌曲切换: ${r} - ${o}`),this._lyrics=[],this._currentIndex=-1,this.requestUpdate(),this._cleanupCache(),this._currentSong=r,this._currentArtist=o;try{await this.searchAndFetchLyrics(r,o)}catch(t){logger.error(`获取歌词失败: ${t.message}`),this._handleLyricsError()}}s&&!this._rafId?this.startTimer():!s&&this._rafId&&this.stopTimer(),this._updateUIElements()}}catch(t){logger.error(`更新组件状态失败: ${t.message}`),this._handleUpdateError(t)}}}_updateRepeatMode(t){let e;if(t.attributes.shuffle)e="shuffle";else switch(t.attributes.repeat){case"all":e="all";break;case"one":e="one";break;default:e="none"}e!==this._repeatMode&&(this._repeatMode=e,this._saveRepeatMode(e))}_cleanupCache(){const t=Date.now();for(const[e,i]of this._lyricsCache.entries())t-i.timestamp>36e5&&this._lyricsCache.delete(e);this._saveCache()}_handleLyricsError(){this._lyrics=[{time:0,text:"获取歌词失败"}],this.requestUpdate()}_handleUpdateError(t){this._rafId=null,this._intervalId=null,this._isInitialUpdate=!0,setTimeout((()=>{this.requestUpdate()}),1e3)}_updateUIElements(){requestAnimationFrame((()=>{try{const t=this.shadowRoot.querySelector(".song-info"),e=this.shadowRoot.querySelector(".title-container"),i=this.shadowRoot.querySelector(".artist-container");if(t&&e&&i){const s=e.offsetWidth+i.offsetWidth,r=t.offsetWidth-32;t.style.justifyContent=s>.7*r?"center":"flex-start"}}catch(t){logger.error(`更新UI元素失败: ${t.message}`)}}))}startTimer(){this.stopTimer(),document.hidden?this._switchToIntervalTimer():this._switchToAnimationFrame()}stopTimer(){this._rafId&&(cancelAnimationFrame(this._rafId),this._rafId=null),this._intervalId&&(clearInterval(this._intervalId),this._intervalId=null)}disconnectedCallback(){super.disconnectedCallback(),this.stopTimer(),document.removeEventListener("visibilitychange",this._visibilityHandler),this._toggleArtistInfoInterval&&clearInterval(this._toggleArtistInfoInterval),this._adjustTipTimer&&clearTimeout(this._adjustTipTimer),this._scrollRecoveryTimer&&clearInterval(this._scrollRecoveryTimer),this._touchHideTimer&&clearTimeout(this._touchHideTimer),this._scrollHealthCheckInterval&&clearInterval(this._scrollHealthCheckInterval),this._fontSizeSliderTimer&&(clearTimeout(this._fontSizeSliderTimer),this._fontSizeSliderTimer=null)}async fetchLyrics(t,e){try{const i=this.hass.auth.data.access_token;if(!i)throw new Error("认证失败");const s=3;let r=null;for(let o=0;o<s;o++)try{const s=await fetch(`/api/netease_lyrics/lyrics?title=${encodeURIComponent(t)}&artist=${encodeURIComponent(e)}`,{headers:{Accept:"application/json",Authorization:`Bearer ${i}`,"Content-Type":"application/json"},credentials:"same-origin"});if(s.ok){const t=await s.json();if(!t.lyrics)throw new Error("未找到歌词");return t}if(401===s.status&&(await new Promise((t=>setTimeout(t,500))),this.hass.auth.refreshAccessToken)){await this.hass.auth.refreshAccessToken();continue}r=new Error(`请求失败: ${s.status}`)}catch(t){if(r=t,o<s-1){await new Promise((t=>setTimeout(t,500)));continue}}throw r||new Error("获取歌词失败")}catch(t){throw logger.error(`获取歌词失败: ${t.message}`),t}}async searchAndFetchLyrics(t,e){const i=this._cleanupSearchText(t),s=this._cleanupSearchText(Array.isArray(e)?e[0]||"":e),r=`${i}-${s}`;try{const o=await this._checkCache(r);if(o)return this._processLyrics(o);const n=[{title:i,artist:s},{title:i,artist:""},{title:t,artist:e}];for(let t=0;t<n.length;t++){const e=n[t];try{logger.info(`尝试搜索 (${t+1}/${n.length}): ${e.title} - ${e.artist}`);const i=await this.fetchLyrics(e.title,e.artist);if(i&&i.lyrics&&i.lyrics.trim())return await this._cacheResult(r,i.lyrics),this._processLyrics(i.lyrics)}catch(e){if(logger.error(`搜索尝试 ${t+1} 失败: ${e.message}`),t===n.length-1)throw e}}throw new Error("未找到歌词")}catch(t){throw logger.error(`搜索歌词失败: ${t.message}`),this._handleSearchError(r),t}}async _cacheResult(t,e){try{this._lyricsCache.set(t,{lyrics:e,timestamp:Date.now()}),this._saveCache(),logger.info(`缓存歌词: ${t}`)}catch(t){logger.error(`缓存歌词失败: ${t.message}`)}}_cleanupSearchText(t){return t.replace(/\(.*?\)|\[.*?\]|（.*?）/g,"").replace(/[\s\-_～〜]+/g," ").trim()}async _checkCache(t){const e=this._lyricsCache.get(t);if(e){if(e.lyrics&&!e.lyrics.includes("搜索歌曲失败")&&e.lyrics.trim())return e.timestamp=Date.now(),this._lyricsCache.set(t,e),this._saveCache(),logger.info(`使用缓存的歌词: ${t}`),e.lyrics;this._lyricsCache.delete(t),this._saveCache(),logger.info(`删除无效的歌词缓存: ${t}`)}return null}async _fetchWithRetry(t,e,i=3){let s=null;for(let r=0;r<i;r++)try{const i=await this.fetchLyrics(t,e);if(i.ok)return i;if(401===i.status&&(await new Promise((t=>setTimeout(t,500))),this.hass.auth.refreshAccessToken)){await this.hass.auth.refreshAccessToken();continue}s=new Error(`请求失败: ${i.status}`)}catch(t){if(s=t,r<i-1){await new Promise((t=>setTimeout(t,500)));continue}}throw s||new Error("暂未找到歌词")}_processLyrics(t){this._lyrics=this.parseLyrics(t);const e=this.hass.states[this.config.entity];null!=e&&e.attributes.media_position&&this.updateCurrentLyricIndex(e.attributes.media_position),this.requestUpdate()}_handleSearchError(t){this._lyrics=[{time:0,text:"搜索歌曲失败"}],this._lyricsCache.has(t)&&(this._lyricsCache.delete(t),this._saveCache()),this.requestUpdate()}parseLyrics(t){if(!t)return[];const e=t.split("\n"),i=[],s=/\[(\d{2}):(\d{2})[\.\:](\d{2,3})\]/g;let r=0,o=0,n=[];e.forEach((t=>{if(!t.trim())return;const e=[...t.matchAll(s)];if(e.length>0){const r=t.replace(s,"").trim();if(!r)return;e.forEach((t=>{const e=parseInt(t[1]),s=parseInt(t[2]),o=parseInt(t[3]),n=6e4*e+1e3*s+(2===t[3].length?10*o:o);i.push({time:n,text:r})}))}})),i.sort(((t,e)=>t.time-e.time));const a=[];for(let t=0;t<i.length-1;t++){const e=i[t+1].time-i[t].time;a.push(e),e>500&&e<8e3&&(r+=e,o++,n.push(e))}const c=o>0?r/o:3e3;let l=0;if(n.length>0){const t=n.reduce(((t,e)=>t+Math.pow(e-c,2)),0);l=Math.sqrt(t/n.length)}const d=2.5*c;for(let t=0;t<i.length-1;t++){const e=i[t+1].time-i[t].time;if(e>d){i[t].text;let s=Math.max(1,Math.round(e/c)-1),r=0;if(t>0){const e=i[t].time-i[t-1].time;if(r=e,t>1){r=(e+(i[t-1].time-i[t-2].time))/2}}const o=r>0?r:c;i[t].isInstrumental=!0,i[t].originalNextTime=i[t+1].time,i[t].predictedInterval=o,s>2&&(i[t].transitionTime=Math.min(i[t+1].time-o,i[t].time+.7*e))}}let h;return c<=2500?(h="fast",this._defaultDuration=2e3):c<=3500?(h="medium",this._defaultDuration=3e3):(h="slow",this._defaultDuration=4e3),this._songRhythmInfo={averageInterval:c,stdDeviation:l,longIntervalThreshold:d,songTempo:h},logger.info(`歌曲节奏: ${h}, 平均间隔: ${Math.round(c)}ms, 标准差: ${Math.round(l)}ms`),i}render(){const t=this.hass.states[this.config.entity],e=this.config.hide_lyrics_container?"height: auto; max-height: none; overflow: visible;":this.config.grid_options&&this.config.grid_options.rows?`height: ${62.5*this.config.grid_options.rows}px; overflow: hidden;`:`max-height: ${this.config.max_height}px; height: auto;`;if(!t)return html`
            <ha-card style="${e} ${this.config.hide_lyrics_container?"--card-height: fit-content; --container-height: auto; --show-border: none; padding-bottom: 8px; --background-top: -16px;":"--card-height: 100%; --container-height: 100%; --show-border: 1px solid rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.12); --background-top: 0;"}"
              class="lyrics-card ${this.config.hide_lyrics_container?"lyrics-hidden":""}">
            <div class="empty-state">
              <ha-icon icon="mdi:help-circle-outline" class="empty-state-icon"></ha-icon>
              <div class="empty-state-text">
                <div class="empty-state-title">未找到媒体播放器</div>
                <div class="empty-state-subtitle">请在配置中设置正确的媒体播放器实体</div>
              </div>
            </div>
          </ha-card>`;const i=(null==t?void 0:t.attributes.media_position)||0,s=null!=t&&t.attributes.media_position_updated_at?new Date(t.attributes.media_position_updated_at).getTime():0,r=Math.max(0,(Date.now()-s)/1e3),o=this._overrideDuration||(null==t?void 0:t.attributes.media_duration)||0,n=Math.min(i+("playing"===(null==t?void 0:t.state)?r:0),o);if(!t.attributes.media_title)return html`
        <ha-card style="${e} ${this.config.hide_lyrics_container?"--card-height: fit-content; --container-height: auto; --show-border: none; padding-bottom: 8px; --background-top: -16px;":"--card-height: 100%; --container-height: 100%; --show-border: 1px solid rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.12); --background-top: 0;"}"
      class="lyrics-card ${this.config.hide_lyrics_container?"lyrics-hidden":""}">
      <div class="card-container">
        ${this.config.show_header?html`
          <div class="header-container">
            <div class="card-header">
              <div class="cover-image-container" @click=${()=>this._showMoreInfo()}>
                ${this._currentAlbumArt||t.attributes.entity_picture?html`
                        <div 
                          class="cover-image"
                          style="background-image: url(${this._currentAlbumArt||t.attributes.entity_picture})"
                        ></div>
                        <div 
                          class="progress-ring"
                          style="--progress: ${n/o}"
                        ></div>
                      `:html`
                        <div class="cover-icon-wrapper">
                          <ha-icon 
                            icon="${t.attributes.icon||"mdi:music"}" 
                            class="cover-icon"
                          ></ha-icon>
                        </div>
                      `}
              </div>
              <div class="song-info">
                <div class="title-container">
                  <div class="title">等待播放</div>
                </div>
                <div class="artist-container">
                  ${this._currentArtist?html`
                        <div class="artist-info-toggle">
                          <div class="artist">
                            ${this._currentArtist}
                          </div>
                        </div>
                      `:html`
                        <div class="artist">未知艺术家</div>
                      `}
                </div>
              </div>
              <div class="media-controls">
                <button 
                  class="control-button" 
                  @click=${()=>this._handleMediaAction("media_previous_track")}
                  ?disabled=${!0}
                >
                  <ha-icon icon="mdi:skip-previous"></ha-icon>
                </button>
                <button 
                  class="control-button" 
                  @click=${()=>this._handleMediaAction("media_play_pause")}
                >
                  <ha-icon icon="mdi:play"></ha-icon>
                </button>
                <button 
                  class="control-button" 
                  @click=${()=>this._handleMediaAction("media_next_track")}
                  ?disabled=${!0}
                >
                  <ha-icon icon="mdi:skip-next"></ha-icon>
                </button>
                <button 
                  class="control-button repeat-button ${"none"!==this._repeatMode?"active":""}" 
                  @click=${()=>this._toggleRepeatMode()}
                  ?disabled=${!0}
                >
                  <ha-icon icon="${this._getRepeatIcon()}"></ha-icon>
                </button>
              </div>
            </div>
          </div>
        `:""}
        ${this.config.hide_lyrics_container?"":html`
          <div class="empty-state">
            <ha-icon icon="mdi:music-note-off" class="empty-state-icon"></ha-icon>
          </div>
        `}
      </div>
    </ha-card>`;if("playing"===t.state&&this.updateCurrentLyricIndex(n),0===this._lyrics.length)return html`
        <ha-card style="${e} ${this.config.hide_lyrics_container?"--card-height: fit-content; --container-height: auto; --show-border: none; padding-bottom: 8px; --background-top: -16px;":"--card-height: 100%; --container-height: 100%; --show-border: 1px solid rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.12); --background-top: 0;"}"
            class="lyrics-card ${this.config.hide_lyrics_container?"lyrics-hidden":""}">
          ${this.config.show_background&&(this._currentAlbumArt||t.attributes.entity_picture)?html`
            <div 
              class="card-background"
              style="background-image: url(${this._currentAlbumArt||t.attributes.entity_picture})"
            ></div>
          `:""}
          <div class="card-container">
            <div class="header-container ${this.config.hide_lyrics_container?"no-lyrics":""}">
            <div class="card-header">
                ${this._currentAlbumArt||t.attributes.entity_picture?html`
                  <div class="cover-image-container" @click=${()=>this._showMoreInfo()}>
                    <div 
                      class="cover-image"
                      style="background-image: url(${this._currentAlbumArt||t.attributes.entity_picture})"
                    ></div>
                    <div 
                      class="progress-ring"
                      style="--progress: ${n/o}"
                    ></div>
                  </div>
                `:""}
              <div class="song-info">
                  <div class="title-container">
                <div class="title">${this._currentSong||"未知歌曲"}</div>
                  </div>
                  <div class="artist-container">
                    ${this.config.show_player_name?html`
                      <div class="artist-info-toggle">
                        <div class="artist ${this._showArtistInfo?"":"hidden"}">
                          ${this._currentArtist||"未知艺术家"}
                        </div>
                        <div class="player-name ${this._showArtistInfo?"hidden":""}">
                          ${this.hass.states[this.config.entity].attributes.friendly_name||this.config.entity.split(".")[1]}
                        </div>
                      </div>
                    `:html`
                      <div class="artist">${this._currentArtist||"未知艺术家"}</div>
                    `}
                  </div>
            </div>
                <div class="media-controls">
                  <button 
                    class="control-button" 
                    @click=${()=>this._handleMediaAction("media_previous_track")}
                  >
                    <ha-icon icon="mdi:skip-previous"></ha-icon>
                  </button>
                  <button 
                    class="control-button" 
                    @click=${()=>this._handleMediaAction("media_play_pause")}
                  >
                    <ha-icon icon="${"playing"===t.state?"mdi:pause":"mdi:play"}"></ha-icon>
                  </button>
                  <button 
                    class="control-button" 
                    @click=${()=>this._handleMediaAction("media_next_track")}
                  >
                    <ha-icon icon="mdi:skip-next"></ha-icon>
                  </button>
                  <button 
                    class="control-button repeat-button ${"none"!==this._repeatMode?"active":""}" 
                    @click=${()=>this._toggleRepeatMode()}
                  >
                    <ha-icon icon="${this._getRepeatIcon()}"></ha-icon>
                  </button>
                </div>
              </div>
            </div>
            ${this.config.hide_lyrics_container?"":html`
              <div class="empty-state">
                <ha-icon icon="mdi:sync" class="empty-state-icon spinning"></ha-icon>
                <div class="empty-state-text">
                  <div class="empty-state-subtitle">正在加载歌词...</div>
                </div>
              </div>
            `}
          </div>
        </ha-card>`;if(1===this._lyrics.length&&this._lyrics[0].text.includes("搜索歌曲失败"))return html`
          <ha-card style="${e} ${this.config.hide_lyrics_container?"--card-height: fit-content; --container-height: auto; --show-border: none; padding-bottom: 8px; --background-top: -16px;":"--card-height: 100%; --container-height: 100%; --show-border: 1px solid rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.12); --background-top: 0;"}"
            class="lyrics-card ${this.config.hide_lyrics_container?"lyrics-hidden":""}">
          ${this.config.show_background&&(this._currentAlbumArt||t.attributes.entity_picture)?html`
            <div 
              class="card-background"
              style="background-image: url(${this._currentAlbumArt||t.attributes.entity_picture})"
            ></div>
          `:""}
          <div class="card-container">
            <div class="header-container ${this.config.hide_lyrics_container?"no-lyrics":""}">
              <div class="card-header">
                ${this._currentAlbumArt||t.attributes.entity_picture?html`
                  <div class="cover-image-container" @click=${()=>this._showMoreInfo()}>
                    <div 
                      class="cover-image"
                      style="background-image: url(${this._currentAlbumArt||t.attributes.entity_picture})"
                    ></div>
                    <div 
                      class="progress-ring"
                      style="--progress: ${n/o}"
                    ></div>
                  </div>
                `:""}
                <div class="song-info">
                  <div class="title-container">
                    <div class="title">${this._currentSong||"未知歌曲"}</div>
                  </div>
                  <div class="artist-container">
                    ${this.config.show_player_name?html`
                      <div class="artist-info-toggle">
                        <div class="artist ${this._showArtistInfo?"":"hidden"}">
                          歌手: ${this._currentArtist||"未知艺术家"}
                        </div>
                        <div class="player-name ${this._showArtistInfo?"hidden":""}">
                          设备: ${this.hass.states[this.config.entity].attributes.friendly_name||this.config.entity.split(".")[1]}
                        </div>
                      </div>
                    `:html`
                      <div class="artist">${this._currentArtist||"未知艺术家"}</div>
                    `}
                  </div>
                </div>
                <div class="media-controls">
                  <button 
                    class="control-button" 
                    @click=${()=>this._handleMediaAction("media_previous_track")}
                  >
                    <ha-icon icon="mdi:skip-previous"></ha-icon>
                  </button>
                  <button 
                    class="control-button" 
                    @click=${()=>this._handleMediaAction("media_play_pause")}
                  >
                    <ha-icon icon="${"playing"===t.state?"mdi:pause":"mdi:play"}"></ha-icon>
                  </button>
                  <button 
                    class="control-button" 
                    @click=${()=>this._handleMediaAction("media_next_track")}
                  >
                    <ha-icon icon="mdi:skip-next"></ha-icon>
                  </button>
                  <button 
                    class="control-button repeat-button ${"none"!==this._repeatMode?"active":""}" 
                    @click=${()=>this._toggleRepeatMode()}
                  >
                    <ha-icon icon="${this._getRepeatIcon()}"></ha-icon>
                  </button>
                </div>
              </div>
            </div>
            ${this.config.hide_lyrics_container?"":html`
              <div class="empty-state">
                <ha-icon icon="mdi:alert-circle-outline" class="empty-state-icon"></ha-icon>
                <div class="empty-state-text">
                  <div class="empty-state-title">暂无歌词</div>
                  <div class="empty-state-subtitle">
                    <div class="troubleshoot-tips">
                      <div class="tip">曲库中未发现相关资源</div>
                    </div>
                  </div>
                </div>
              </div>
            `}
          </div>
        </ha-card>`;const a=html`
        <ha-card style="${e} ${this.config.hide_lyrics_container?"--card-height: fit-content; --container-height: auto; --show-border: none; padding-bottom: 8px; --background-top: -16px;":"--card-height: 100%; --container-height: 100%; --show-border: 1px solid rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.12); --background-top: 0;"}"
          class="lyrics-card ${this.config.hide_lyrics_container?"lyrics-hidden":""}"
          @dblclick=${this._toggleLyricsContainer}>
        ${this.config.show_background&&(this._currentAlbumArt||t.attributes.entity_picture)?html`
          <div 
            class="card-background"
            style="background-image: url(${this._currentAlbumArt||t.attributes.entity_picture})"
          ></div>
        `:""}
        <div class="card-container">
          ${this.config.show_header?html`
            <div class="header-container ${this.config.hide_lyrics_container?"no-lyrics":""}">
              <div class="card-header">
                ${this._currentAlbumArt||t.attributes.entity_picture?html`
                  <div class="cover-image-container" @click=${()=>this._showMoreInfo()}>
                    <div 
                      class="cover-image"
                      style="background-image: url(${this._currentAlbumArt||t.attributes.entity_picture})"
                    ></div>
                    <div 
                      class="progress-ring"
                      style="--progress: ${n/o}"
                    ></div>
                  </div>
                `:""}
                <div class="song-info">
                  <div class="title-container">
                    <div class="title">${this._currentSong||"未知歌曲"}</div>
                  </div>
                  <div class="artist-container">
                    ${this.config.show_player_name?html`
                      <div class="artist-info-toggle">
                        <div class="artist ${this._showArtistInfo?"":"hidden"}">
                          歌手: ${this._currentArtist||"未知艺术家"}
                        </div>
                        <div class="player-name ${this._showArtistInfo?"hidden":""}">
                          设备: ${this.hass.states[this.config.entity].attributes.friendly_name||this.config.entity.split(".")[1]}
                        </div>
                      </div>
                    `:html`
                      <div class="artist">${this._currentArtist||"未知艺术家"}</div>
                    `}
                  </div>
                </div>
                <div class="media-controls">
                  <button 
                    class="control-button" 
                    @click=${()=>this._handleMediaAction("media_previous_track")}
                  >
                    <ha-icon icon="mdi:skip-previous"></ha-icon>
                  </button>
                  <button 
                    class="control-button" 
                    @click=${()=>this._handleMediaAction("media_play_pause")}
                  >
                    <ha-icon icon="${"playing"===t.state?"mdi:pause":"mdi:play"}"></ha-icon>
                  </button>
                  <button 
                    class="control-button" 
                    @click=${()=>this._handleMediaAction("media_next_track")}
                  >
                    <ha-icon icon="mdi:skip-next"></ha-icon>
                  </button>
                  <button 
                    class="control-button repeat-button ${"none"!==this._repeatMode?"active":""}" 
                    @click=${()=>this._toggleRepeatMode()}
                  >
                    <ha-icon icon="${this._getRepeatIcon()}"></ha-icon>
                  </button>
                </div>
              </div>
            </div>
          `:""}
          ${this.config.hide_lyrics_container?"":html`
            <div class="content-container ${this.config.show_header?"":"no-header"}">
          <div class="card-content" style="visibility: ${this._fontReady?"visible":"hidden"}; transition: visibility 0.2s;">
                  <div class="lyrics-adjust-controls">
                    <div class="adjust-tip ${this._showAdjustTip?"show":""}">${this._adjustTipText}</div>
                    <button 
                      class="adjust-button" 
                      @click=${()=>this._adjustLyricTime(.1)}
                      @mouseenter=${()=>this._showAdjustTooltip("增加时间偏移(提前显示)")}
                    >+</button>
                    <button 
                      class="adjust-button" 
                      @click=${()=>this._adjustLyricTime(-.1)}
                      @mouseenter=${()=>this._showAdjustTooltip("减少时间偏移(延迟显示)")}
                    >-</button>
                  </div>
                  <div 
                    class="lyrics-container ${this.config.show_header?"":"no-header"} ${this._useFixedHeight?"fixed-height":""}"
                    @touchstart=${t=>{this._longPressTimer=setTimeout((()=>{this._handleLyricsLongPress(t)}),800)}}
                    @mousedown=${t=>{this._longPressTimer=setTimeout((()=>{this._handleLyricsLongPress(t)}),800)}}
                    @touchend=${()=>{clearTimeout(this._longPressTimer)}}
                    @mouseup=${()=>{clearTimeout(this._longPressTimer)}}
                    @touchmove=${()=>{clearTimeout(this._longPressTimer)}}
                    @mousemove=${()=>{clearTimeout(this._longPressTimer)}}
                    style="${this._useFixedHeight?"max-height: 450px; overflow-y: auto;":""}"
                  >
                    <div class="lyrics-top-spacer"></div>
                    ${this._showFontSizeSlider?this._renderFontSizeSlider():""}
                    ${this._lyrics.map(((t,e)=>html`
                      <div 
                        class="lyric ${e===this._currentIndex?"active":""}"
                        style="${e===this._currentIndex?`${this.config.show_karaoke?`--progress: ${100*this._currentLyricProgress}%;`:""} font-size: ${this._lyricFontSizeActive}px;`:`font-size: ${this._lyricFontSize}px;`}"
                        @touchstart=${e===this._currentIndex?t=>{this._longPressTimer=setTimeout((()=>{this._handleLyricsLongPress(t)}),800)}:null}
                        @mousedown=${e===this._currentIndex?t=>{this._longPressTimer=setTimeout((()=>{this._handleLyricsLongPress(t)}),800)}:null}
                        @touchend=${e===this._currentIndex?()=>{clearTimeout(this._longPressTimer)}:null}
                        @mouseup=${e===this._currentIndex?()=>{clearTimeout(this._longPressTimer)}:null}
                        @touchmove=${e===this._currentIndex?()=>{clearTimeout(this._longPressTimer)}:null}
                        @mousemove=${e===this._currentIndex?()=>{clearTimeout(this._longPressTimer)}:null}
                      >
                        ${t.text}
                      </div>
                    `))}
                    <div class="lyrics-spacer"></div>
                  </div>
                </div>
              </div>
            </div>
          `}
          </div>
        </ha-card>
      `;if(this.config.show_floating_lyrics&&this._lyrics.length>0&&this._currentIndex>=0){const e=this._lyrics[this._currentIndex],i=this._lyrics[this._currentIndex+1],s=((null==t?void 0:t.attributes.media_position)||0)+this._lyricTimeOffset,r=Math.floor(1e3*s);let o;o=e.isInstrumental&&e.predictedInterval?r>=e.transitionTime?Math.min((e.originalNextTime-e.transitionTime)/1e3,1.5):e.predictedInterval/1e3:i?(i.time-e.time)/1e3:2;const n=e.text,c=n.length,l=o/(1.2*c);let d;if(/^[\x00-\x7F\s.,'"\-?!:;()]+$/.test(n)){const t=n.split(/(\s+)/);let e=0;d=t.map((t=>{if(/^\s+$/.test(t))return e+=t.length,t;{const i=e;if(e+=t.length,this.config.show_karaoke){const e=i*l,s=this._currentLyricProgress*o;return html`
                  <span style="--duration:${o}s;" class="${s>=e?"active":""}">${t}</span>
                `}return html`<span>${t}</span>`}}))}else d=n.split("").map(((t,e)=>{if(this.config.show_karaoke){const i=e*l,s=this._currentLyricProgress*o;return html`
                <span style="--duration: ${o}s; margin: 0 2px;"
                      class="${s>=i?"active":""}"
                >${t}</span>
              `}return html`<span style="margin: 0 2px;">${t}</span>`}));const h=html`
        <div class="floating-lyrics-container"
             style="${Object.entries(this._floatingPosition).map((([t,e])=>`${t}:${e}`)).join(";")}"
             @mousedown=${this._dragStart}
             @touchstart=${this._touchStart}
             @dblclick=${this._handleDoubleClick}
             @pointerdown=${this._handlePointerDown}
             @pointerup=${this._handlePointerUp}
             @pointercancel=${this._handlePointerCancel}
        >
          <div class="floating-lyrics ${"playing"===t.state?"playing":""}"
               style="visibility: ${this._fontReady?"visible":"hidden"}; transition: visibility 0.2s;
                 ${this.config.show_karaoke?`--progress: ${100*this._currentLyricProgress}%;`:""}
                 --text-color: ${this._lyricsSettings.textColor.startsWith("#")?this._lyricsSettings.textColor:"var(--primary-color)"};
                 font-family: ${this._lyricsSettings.fontFamily}, var(--lyrics-font);
                 font-size: ${this._lyricsSettings.fontSize};
                 font-weight: ${this._lyricsSettings.fontWeight};
                 text-shadow: 0 1px 0 ${this._lyricsSettings.strokeColor},
                            1px 0 0 ${this._lyricsSettings.strokeColor},
                            -1px 0 0 ${this._lyricsSettings.strokeColor},
                            0 -1px 0 ${this._lyricsSettings.strokeColor};
                 ${this.config.show_karaoke?"":"letter-spacing: 0.05em;"}
               "
          >
            ${d}
          </div>
        </div>
      `;return html`${a}${h}${this._renderSettingsDialog()}`}return html`${a}`}static get styles(){return css`
      :host {
        --lyrics-font: '黑体', 'Noto Sans SC', system-ui, -apple-system, BlinkMacSystemFont, 
                     "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans",
                     sans-serif, "Apple Color Emoji", "Segoe UI Emoji",
                     "Segoe UI Symbol", "Noto Color Emoji";
        --card-max-height: 400px;
        display: block !important;
        height: auto !important;
        width: 100% !important;
        overflow: visible !important;
        grid-column: 1 / span 12 !important;
        box-sizing: border-box !important;
        
        grid-template-columns: 1fr !important;
        grid-template-areas: "host" !important;
      }
      
        :host {
          display: block;
          height: 100%;
        }
        ha-card {
        padding: 8px 16px;
        height: ${unsafeCSS("var(--card-height, auto)")};
        min-height: ${unsafeCSS("var(--card-min-height, auto)")};
        width: 100% !important;
        max-width: 100% !important;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        background: var(--ha-card-background, var(--card-background-color, white));
        border-radius: 20px;
        box-shadow: var(--ha-card-box-shadow, none);
        position: relative;
        box-sizing: border-box;
        
        grid-column: 1 / span 12 !important;
        grid-template-columns: 1fr !important;
        grid-template-areas: "card" !important;
      }
      
      ha-card.fixed-height {
        max-height: var(--card-max-height);
        overflow-y: auto;
      }
      
      .card-background {
        position: absolute;
        top: ${unsafeCSS("var(--background-top, 0)")};
        left: 0;
        right: 0;
        bottom: 0;
        background-size: cover;
        background-position: center;
        filter: blur(16px);
        transform: scale(1.1);
        transition: background-image 0.8s ease-in-out, top 0.3s ease-in-out;
        opacity: 0.3;
        z-index: 0;
      }
      
      .card-background::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(
          180deg,
          var(--ha-card-background, var(--card-background-color, white)) 0%,
          rgba(var(--rgb-card-background-color, 255, 255, 255), 0.8) 20%,
          rgba(var(--rgb-card-background-color, 255, 255, 255), 0.6) 40%,
          rgba(var(--rgb-card-background-color, 255, 255, 255), 0.6) 60%,
          rgba(var(--rgb-card-background-color, 255, 255, 255), 0.8) 80%,
          var(--ha-card-background, var(--card-background-color, white)) 100%
        );
      }
      
      .card-container {
        display: flex;
        flex-direction: column;
        height: 100%; 
        position: relative;
        z-index: 1;
      }

      .header-container {
          flex-shrink: 0;
        padding: 8px 0px 10px 0px;
        border-bottom: ${unsafeCSS("var(--show-border, 1px solid rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.12))")};
      }

      .header-container.no-lyrics {
        padding: 8px 0;
        border-bottom: none;
      }

      .content-container {
        flex: 1;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        height: 100%; 
      }

      .content-container.hidden {
        display: none;
      }

      .card-header {
          position: relative;
          z-index: 2;
          display: grid;
          grid-template-areas: "i info controls";
          grid-template-columns: min-content minmax(0, 1fr) auto;
          gap: 12px;
          align-items: center;
          height: 52px;
          padding: 0 16px;
          
          grid-row: 1;
          isolation: isolate;
        }
      
      @media (max-width: 600px) {
        .card-header {
          padding: 0 12px;
          gap: 10px; 
        }
        .lyrics-hidden .header-container {
            padding: 0;
        }  
        .media-controls {
          gap: 3px; 
        }
      }

        .song-info {
        grid-area: info;
          display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 2px;
        min-width: 0;
        max-width: none;
        padding: 0 16px;
        margin: 0;
          justify-content: center;
      }

      .text-container {
        display: flex;
        align-items: center;
        overflow: hidden;
        width: 100%;
      }

      .title-container {
        flex: 0 1 auto;
        min-width: 0;
        width: 100%;
        text-align: left;
      }

      .artist-container {
        flex: 0 1 auto;
        width: 100%;
        text-align: left;
        position: relative;
        z-index: 1;
        min-height: 16px;
      }

        .title {
        font-size: 15px;
          font-weight: 600;
        font-family: montserrat;
        color: var(--primary-text-color);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        padding: 0;
        line-height: 1.2;
        }

        .artist {
        font-size: 12px;
        font-family: montserrat;
        font-weight: 400;
          color: var(--secondary-text-color);
        opacity: 0.7;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        line-height: 1.2;
        }

        .artist::before {
        content: none;
      }

      .cover-image-container {
        grid-area: i;
        width: 3.2rem;
        height: 3.2rem;
          position: relative;
        cursor: pointer;
      }

      .cover-image {
        width: 100%;
        height: 100%;
        border-radius: 8px;
        background-size: cover;
        background-position: center;
        position: relative;
        z-index: 2;
        transition: all 0.2s ease;
      }
      
      .progress-ring {
          position: absolute;
        inset: -1px;
        border-radius: 8px;
        background: conic-gradient(
          from 270deg at 50% 50%,
          var(--primary-color) 0deg,
          var(--primary-color) calc(var(--progress, 0) * 360deg),
          rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.05) calc(var(--progress, 0) * 360deg),
          rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.05) 360deg
        );
          z-index: 1;
        opacity: 0.7;
        transition: opacity 0.2s ease;
        clip-path: inset(0 round 8px);
      }

      .cover-image-container:hover .cover-image {
        transform: scale(1.02);
      }

      .cover-image-container:hover .progress-ring {
        opacity: 0.9;
      }
      
      .card-content {
        position: relative;
        flex: 1;
        overflow: hidden;
        padding: 8px 0;
      }
      .card-content::before,
        .card-content::after {
        content: none;
        }
        .lyrics-container {
          height: 100%;
          overflow-y: auto;
          overflow-x: hidden;
          scrollbar-width: none;
          -ms-overflow-style: none;
          position: relative;
        scroll-behavior: smooth;
        will-change: scroll-position;
        -webkit-overflow-scrolling: touch;
        transition: scroll-behavior 0.3s ease;
        
        mask-image: linear-gradient(
          to bottom,
          transparent 0%,
          black 15%,
          black 85%,
          transparent 100%
        );
        -webkit-mask-image: linear-gradient(
          to bottom,
          transparent 0%,
          black 15%,
          black 85%,
          transparent 100%
        );
      }
      .lyrics-container.no-header {
        padding-top: 2px;
        }
        .lyrics-container::-webkit-scrollbar {
          display: none;
        }
        .lyric {
        padding: 10px 16px;
        text-align: center;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        line-height: 1.5;
        font-weight: 400;
        letter-spacing: -0.2px;
        transform: scale(0.95);
        color: var(--secondary-text-color);
        opacity: 0.6;
      }
      .lyric.active {
        opacity: 1;
        font-weight: 600;
        transform: scale(1.05);
        padding: 10px 26px;
        letter-spacing: -0.1px;
        color: var(--primary-color);
      }
      .lyric.active[style*="--progress"] {
        background: linear-gradient(
          90deg,
          var(--primary-color) 0%,
          var(--primary-color) var(--progress, 0%),
          var(--secondary-text-color) var(--progress, 0%),
          var(--secondary-text-color) 100%
        );
        background-clip: text;
        -webkit-background-clip: text;
        color: transparent;
        transition: none;
        will-change: background;
        -webkit-font-smoothing: antialiased;
      }
      .lyric.active:not([style*="--progress"]) {
        color: var(--primary-color);
      }
      .lyrics-top-spacer {
        height: 16px;
        flex-shrink: 0;
        }
        .lyrics-spacer {
          height: 50px;
          flex-shrink: 0;
        }
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 220px;
        padding: 24px;
        text-align: center;
      }
      .empty-state-icon {
        --mdc-icon-size: 60px;
        color: var(--disabled-text-color, rgba(0, 0, 0, 0.38));
        margin-bottom: 16px;
      }
      .empty-state-text {
        max-width: 300px;
      }
      .empty-state-title {
        font-size: 20px;
        font-weight: 500;
        margin-bottom: 8px;
        color: var(--primary-text-color);
        opacity: 0.87;
      }
      .empty-state-subtitle {
        font-size: 14px;
        line-height: 1.5;
        color: var(--secondary-text-color);
        opacity: 0.7;
      }
      .troubleshoot-tips {
        text-align: left;
        margin-top: 12px;
      }
      .tip {
        margin: 8px 0;
        color: var(--secondary-text-color);
      }
      .spinning {
        animation: spin 2s linear infinite;
      }
      @keyframes spin {
        100% {
          transform: rotate(360deg);
        }
      }
      .media-controls {
        grid-area: controls;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .control-button {
        background: none;
        border: none;
        color: var(--primary-text-color);
        cursor: pointer;
        padding: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0.8;
        transition: all 0.2s ease;
        border-radius: 50%;
      }

      .control-button:hover {
        opacity: 1;
        background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.1);
      }

      .control-button ha-icon {
        --mdc-icon-size: 24px;
        color: var(--primary-text-color);
      }

      @media (max-width: 600px) {
        .cover-image-container {
          width: 3rem;
          height: 3rem;
        }
        
        .song-info {
          padding: 0 8px;
        }
        .media-controls {
          gap: 3px; 
        }
      }

      .floating-lyrics-container {
        position: fixed;
        z-index: 999;
        cursor: move;
        user-select: none;
        pointer-events: auto;
        width: auto;
        max-width: min(800px, 90vw);
        text-align: center;
        touch-action: none;
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .floating-lyrics {
        position: relative;
        font-size: clamp(24px, 5vw, 36px);
        font-weight: bold;
        opacity: 0;
        transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        background: transparent;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        will-change: transform, opacity;
        display: inline-block;
        white-space: nowrap;
        overflow: visible;
        line-height: 1.4;
        margin: 0 auto;
        color: var(--text-color, var(--primary-color));
        font-family: var(--lyrics-font);
      }

      .floating-lyrics.playing {
        opacity: 1;
      }

      .floating-lyrics[style*="--progress"] span {
        display: inline-block;
        color: var(--text-color, var(--primary-color));
        opacity: 0;
        transform: translateY(20px);
        animation: wave var(--duration, 2s) cubic-bezier(0.4, 0, 0.2, 1) infinite;
        margin: 0 1px;
      }

      .floating-lyrics[style*="--progress"] span.active {
        opacity: 1;
        transform: translateY(0);
        transition: 
          opacity 0.15s cubic-bezier(0.4, 0, 0.2, 1),
          transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        color: var(--text-color, var(--primary-color));
      }

      @keyframes wave {
        0%, 100% {
          transform: translateY(0) scale(1);
        }
        50% {
          transform: translateY(-8px) scale(1.02);
        }
      }

      @media (min-width: 1200px) {
        .floating-lyrics {
          font-size: 36px;
          padding: 24px 48px;
        }
      }

      @media (max-width: 900px) {
        .floating-lyrics {
          font-size: 30px;
          padding: 16px 32px;
        }
      }

      @media (max-width: 600px) {
        .floating-lyrics-container {
          max-width: 95vw;
          padding: 0 10px;
        }
        
        .floating-lyrics {
          font-size: 24px;
          padding: 12px 20px;
        }

        .floating-lyrics span {
          margin: 0 1px; 
        }
      }

      @media (prefers-color-scheme: dark) {
        .floating-lyrics {
          text-shadow: 
            0 1px 0 rgba(0,0,0,0.8),
            1px 0 0 rgba(0,0,0,0.8),
            -1px 0 0 rgba(0,0,0,0.8),
            0 -1px 0 rgba(0,0,0,0.8),
            1px 1px 3px rgba(255,255,255,0.1),
            -1px -1px 3px rgba(255,255,255,0.1);
        }
      }

      .settings-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: transparent;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        pointer-events: none;
      }

      .settings-dialog {
        background: rgba(var(--rgb-card-background-color, 255, 255, 255), 0.85);
        border-radius: 12px;
        width: 300px;
        max-height: 400px;
        overflow-y: auto;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05);
        animation: fadeIn 0.2s ease-out;
        pointer-events: auto;
        backdrop-filter: blur(5px);
        -webkit-backdrop-filter: blur(5px);
      }

      .settings-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        border-bottom: 1px solid rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.08);
      }

      .settings-header h3 {
        margin: 0;
        font-size: 14px;
        font-weight: 500;
        color: var(--primary-text-color);
      }

      .settings-content {
        padding: 16px;
      }

      .settings-group {
        margin-bottom: 16px;
      }

      .settings-group:last-child {
        margin-bottom: 0;
      }

      .settings-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 10px;
        font-size: 13px;
      }

      .settings-item:last-child {
        margin-bottom: 0;
      }

      .settings-item span {
        color: var(--primary-text-color);
        opacity: 0.9;
      }

      .settings-item input[type="text"],
      .settings-item input[type="number"],
      .settings-item select {
        width: 120px;
        padding: 6px 8px;
        border: 1px solid var(--divider-color);
        border-radius: 6px;
        background: var(--card-background-color);
        color: var(--primary-text-color);
        font-size: 12px;
      }

      .settings-item input[type="color"] {
        width: 32px;
        height: 32px;
        padding: 2px;
        border: 1px solid var(--divider-color);
        border-radius: 6px;
        background: var(--card-background-color);
        cursor: pointer;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .repeat-button {
        transition: all 0.2s ease;
      }
      
      .repeat-button.active {
        opacity: 1;
        color: var(--primary-color);
      }
      
      .repeat-button ha-icon {
        --mdc-icon-size: 22px;
      }

      .shuffle-button {
        opacity: 0.5;
        transition: all 0.2s ease;
      }

      .shuffle-button.active {
        opacity: 1;
        color: var(--primary-color);
      }

      .shuffle-button ha-icon {
        --mdc-icon-size: 22px;
      }
      
      ha-card.legacy-mode {
        max-height: var(--max-height, 400px);
        overflow-y: auto;
      }

      .font-size-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
      }

      .font-size-slider-container {
        width: 240px;
        max-width: 80%;
        margin: 0 auto 10px auto;
        padding: 8px 0;
        position: sticky;
        top: 0;
        z-index: 10;
      }

      .font-size-slider {
        width: 100%;
        height: 6px;
        -webkit-appearance: none;
        appearance: none;
        background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.1);
        border-radius: 3px;
        outline: none;
      }

      .font-size-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: var(--primary-color);
        cursor: pointer;
        border: 2px solid white;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
      }

      .font-size-slider::-moz-range-thumb {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: var(--primary-color);
        cursor: pointer;
        border: 2px solid white;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
      }

      .font-size-slider-wrapper {
        position: sticky;
        top: 0;
        z-index: 10;
        background: linear-gradient(to bottom, 
          rgba(var(--rgb-card-background-color, 255, 255, 255), 0.8) 0%,
          rgba(var(--rgb-card-background-color, 255, 255, 255), 0.8) 70%,
          rgba(var(--rgb-card-background-color, 255, 255, 255), 0) 100%);
        padding: 8px 0;
        margin-bottom: 12px;
      }

      .preview-text {
        text-align: center;
        color: var(--primary-color);
        padding: 8px 0;
        font-weight: 500;
        line-height: 1.4;
      }
      
      .lyrics-container.fixed-height {
        max-height: 450px;
        overflow-y: auto;
        scrollbar-width: thin;
        -ms-overflow-style: none;
      }
      
      .lyrics-container.fixed-height::-webkit-scrollbar {
        width: 4px;
      }
      
      .lyrics-container.fixed-height::-webkit-scrollbar-thumb {
        background-color: rgba(var(--rgb-primary-color, 33, 150, 243), 0.4);
        border-radius: 4px;
      }
      
      .lyrics-container.fixed-height::-webkit-scrollbar-track {
        background: transparent;
      }
      
      ha-card.lyrics-hidden {
        height: auto !important;
        min-height: 0 !important;
        overflow: visible !important;
      }
      
      .lyrics-hidden .header-container {
        padding: 8px 0;
        border-bottom: none;
      }
      
      .lyrics-hidden .card-container {
        height: auto !important;
      }
      
      .lyrics-hidden .card-header {
        justify-content: center;
      }
      
      .lyrics-hidden .cover-image-container {
        width: 3rem;
        height: 3rem;
      }
      
      .lyrics-hidden .song-info {
        text-align: center;
        align-items: center;
      }

      .lyrics-hidden .card-background {
        filter: blur(18px); 
        transform: scale(0.98); 
        opacity: 0.25; 
      }
      
      .lyrics-hidden .header-container {
        padding: 12px 0px 12px 0px;
        border-bottom: none;
      }
      
      .lyrics-hidden .card-header {
        height: 42px; 
      }
      
      .artist-info-toggle {
        position: relative;
        height: 16px;
        overflow: visible; 
        z-index: 2;
      }
      
      .artist-info-toggle .artist,
      .artist-info-toggle .player-name {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 16px;
        line-height: 16px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        transition: opacity 0.8s ease, filter 0.8s ease, transform 0.8s ease;
        backface-visibility: hidden;
        transform-origin: left center;
        will-change: opacity, filter, transform;
      }
      
      .artist-info-toggle .artist.hidden,
      .artist-info-toggle .player-name.hidden {
        opacity: 0;
        filter: blur(2px); 
        transform: scale(0.90);
        pointer-events: none;
      }
      
      .artist-info-toggle .artist,
      .artist-info-toggle .player-name {
        opacity: 1;
        filter: blur(0); 
        transform: scale(1);
      }
      
      .artist-info-toggle .player-name {
        font-size: 12px;
        font-family: montserrat;
        font-weight: 400;
        color: var(--secondary-text-color);
        opacity: 0.7;
      }

      .lyrics-adjust-buttons {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        display: flex;
        flex-direction: column;
        gap: 8px;
        opacity: 0;
        transition: opacity 0.3s ease;
        z-index: 10;
      }

      .lyrics-container:hover .lyrics-adjust-buttons {
        opacity: 1;
      }

      .lyrics-adjust-left {
        left: 8px;
      }

      .lyrics-adjust-right {
        right: 8px;
      }

      .adjust-button {
        background: rgba(0, 0, 0, 0.5);
        color: white;
        border: none;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 18px;
        opacity: 0.7;
        transition: opacity 0.2s ease;
      }

      .adjust-button:hover {
        opacity: 1;
      }

      .time-offset-display {
        position: absolute;
        top: 8px;
        right: 8px;
        background: rgba(0, 0, 0, 0.5);
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      .lyrics-container:hover .time-offset-display {
        opacity: 0.7;
      }

      .lyrics-wrapper {
        position: relative;
        height: 100%;
      }

      .lyrics-adjust-controls {
        position: absolute;
        right: 0;
        top: 50%;
        transform: translateY(-50%);
        display: flex;
        flex-direction: column;
        gap: 8px;
        z-index: 10;
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: none; 
      }

      
      .card-content:hover .lyrics-adjust-controls {
        opacity: 1;
        pointer-events: auto; 
      }

      
      .lyrics-adjust-controls.touch-visible {
        opacity: 1;
        pointer-events: auto;
      }

      .adjust-button {
        background: rgba(var(--rgb-primary-color, 33, 150, 243), 0.15);
        color: var(--primary-color);
        border: none;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 18px;
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        transition: all 0.2s ease;
      }

      .adjust-button:hover {
        background: rgba(var(--rgb-primary-color, 33, 150, 243), 0.25);
      }

      .adjust-tip {
        position: absolute;
        right: 42px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        white-space: nowrap;
        opacity: 0;
        transform: translateX(10px);
        transition: all 0.2s ease;
        pointer-events: none;
      }

      .adjust-tip.show {
        opacity: 1;
        transform: translateX(0);
      }

      @media (max-width: 600px) {
        .lyrics-adjust-controls {
          right: 8px;
        }
        
        .adjust-button {
          width: 28px;
          height: 28px;
          font-size: 16px;
        }
      }

      .lyrics-wrapper {
        position: relative;
        height: 100%;
        padding-right: 48px; 
      }

      .lyrics-adjust-controls {
        position: absolute;
        right: 0;
        top: 50%;
        transform: translateY(-50%);
        display: flex;
        flex-direction: column;
        gap: 8px;
        z-index: 10;
      }

      .adjust-button {
        background: rgba(var(--rgb-primary-color, 33, 150, 243), 0.15);
        color: var(--primary-color);
        border: none;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 18px;
        opacity: 0.7;
        transition: all 0.2s ease;
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
      }

      .adjust-button:hover {
        opacity: 1;
        background: rgba(var(--rgb-primary-color, 33, 150, 243), 0.25);
      }

 

      .adjust-tip {
        position: absolute;
        right: 42px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        white-space: nowrap;
        opacity: 0;
        transform: translateX(10px);
        transition: all 0.2s ease;
        pointer-events: none;
      }

      .adjust-tip.show {
        opacity: 1;
        transform: translateX(0);
      }

      .lyrics-container {
        height: 100%;
        overflow-y: auto;
        overflow-x: hidden;
        position: relative;
        scroll-behavior: smooth;
        
      }

      @media (max-width: 600px) {
        .lyrics-wrapper {
          padding-right: 40px;
        }
        
        .lyrics-adjust-controls {
          opacity: 0.4;
        }
        
        .adjust-button {
          width: 28px;
          height: 28px;
          font-size: 16px;
        }


      }

      
      .floating-lyrics:not([style*="--progress"]) {
        letter-spacing: 0.05em;
      }

      
      @supports (-webkit-hyphens: none) {
        .floating-lyrics:not([style*="--progress"]) {
          letter-spacing: 0.08em; 
        }
      }
      
      
      ha-card {
        transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), 
                   height 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), 
                   box-shadow 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
                   padding 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        will-change: transform, height, box-shadow;
        transform-origin: center center;
      }
      
      
      ha-card.transition-effect {
        transform: scale(1.02) translateZ(0);
        box-shadow: var(--ha-card-box-shadow, 0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 1px 5px 0 rgba(0, 0, 0, 0.12), 0 3px 1px -2px rgba(0, 0, 0, 0.2)),
                   0 8px 16px rgba(var(--rgb-primary-color, 33, 150, 243), 0.12),
                   0 2px 8px rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        border: 1px solid rgba(var(--rgb-primary-color, 33, 150, 243), 0.08);
        transition-duration: 0.2s !important;
      }
      
      
      .content-container {
        transition: max-height 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), 
                   opacity 0.15s ease, 
                   margin 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        will-change: max-height, opacity;
        overflow: hidden;
      }
      
      
      .header-container {
        transition: padding 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), 
                   border-bottom 0.15s ease;
        will-change: padding, border-bottom;
      }
      
      
      .card-background {
        transition: filter 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), 
                   transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), 
                   opacity 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
                   top 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        will-change: filter, transform, opacity;
      }

      .lyrics-adjust-controls {
        position: absolute;
        right: 0;
        top: 50%;
        transform: translateY(-50%);
        display: flex;
        flex-direction: column;
        gap: 8px;
        z-index: 10;
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: none;
      }

      .card-content:hover .lyrics-adjust-controls,
      .card-content:active .lyrics-adjust-controls,
      .card-content.touching .lyrics-adjust-controls {
        opacity: 1;
        pointer-events: auto;
      }

      @media (max-width: 600px) {
        .lyrics-adjust-controls {
          opacity: 0;
        }
        .card-content:hover .lyrics-adjust-controls,
        .card-content:active .lyrics-adjust-controls,
        .card-content.touching .lyrics-adjust-controls {
          opacity: 1;
        }
      }

      .cover-icon-wrapper {
        width: 100%;
        height: 100%;
        border-radius: 8px;
        background: none;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }

      .cover-icon {
        --mdc-icon-size: 44px;
        width: 44px;
        height: 44px;
        color: var(--primary-color);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    `}getCardSize(){if(this.config.hide_lyrics_container)return this.config.show_header?1:0;if(this.config.grid_options&&this.config.grid_options.rows)return this.config.grid_options.rows;return(this.config.show_header?1:0)+1}_handleVisibilityChange(){document.hidden?this._switchToIntervalTimer():this._switchToAnimationFrame()}_switchToIntervalTimer(){this.stopTimer(),this._intervalId=setInterval((()=>{this.requestUpdate()}),250)}_switchToAnimationFrame(){this._intervalId&&(clearInterval(this._intervalId),this._intervalId=null);let t=performance.now();const e=()=>{const i=performance.now();i-t>=16&&(this.requestUpdate(),t=i),this._rafId=requestAnimationFrame(e)};this._rafId=requestAnimationFrame(e)}static getConfigElement(){return document.createElement("netease-lyrics-card-editor")}static getStubConfig(t){const e=Object.keys(t.states).filter((t=>t.startsWith("media_player.")));return{entity:e.length>0?e[0]:"",show_background:!1,show_header:!1,show_karaoke:!1,show_floating_lyrics:!1,hide_lyrics_container:!1,grid_options:{columns:12,rows:6}}}_handleMediaAction(t){this.hass.callService("media_player",t,{entity_id:this.config.entity})}_shouldScroll(t){const e=document.createElement("div");e.style.visibility="hidden",e.style.position="absolute",e.style.whiteSpace="nowrap",e.style.font="15px montserrat",e.textContent=t,document.body.appendChild(e);const i=e.offsetWidth;return document.body.removeChild(e),i>180}_showMoreInfo(){const t=new CustomEvent("hass-more-info",{bubbles:!0,composed:!0,detail:{entityId:this.config.entity}});this.dispatchEvent(t)}_loadPosition(){if(window.innerWidth<=600)return this._calculateInitialPosition();try{const t=localStorage.getItem("lyrics_floating_position");return t?JSON.parse(t):this._calculateInitialPosition()}catch(t){return this._calculateInitialPosition()}}_savePosition(t){window.innerWidth>600&&localStorage.setItem("lyrics_floating_position",JSON.stringify(t))}_calculateInitialPosition(){return{bottom:`${window.innerWidth<=600?80:100}px`,left:"50%",transform:"translateX(-50%)",position:"fixed"}}_bindDragEvents(){this._dragStart=this._dragStart.bind(this),this._dragMove=this._dragMove.bind(this),this._dragEnd=this._dragEnd.bind(this)}_dragStart(t){if(!this.config.show_floating_lyrics)return;const e=this.shadowRoot.querySelector(".floating-lyrics-container");e&&(this._isDragging=!0,this._dragStartPos={x:t.clientX-e.offsetLeft,y:t.clientY-e.offsetTop},document.addEventListener("mousemove",this._dragMove),document.addEventListener("mouseup",this._dragEnd))}_dragMove(t){if(!this._isDragging)return;const e=this.shadowRoot.querySelector(".floating-lyrics-container");if(!e)return;const i=t.clientX-this._dragStartPos.x,s=t.clientY-this._dragStartPos.y,r=window.innerWidth-e.offsetWidth,o=window.innerHeight-e.offsetHeight,n=Math.max(0,Math.min(r,i)),a=Math.max(0,Math.min(o,s));this._floatingPosition={left:`${n}px`,top:`${a}px`,transform:"none",position:"fixed"},this.requestUpdate()}_dragEnd(){this._isDragging&&(this._isDragging=!1,this._savePosition(this._floatingPosition),document.removeEventListener("mousemove",this._dragMove),document.removeEventListener("mouseup",this._dragEnd))}_bindTouchEvents(){this._touchStart=this._touchStart.bind(this),this._touchMove=this._touchMove.bind(this),this._touchEnd=this._touchEnd.bind(this);const t=this.shadowRoot.querySelector(".card-content");t&&(t.addEventListener("touchstart",(()=>{this._touchHideTimer&&clearTimeout(this._touchHideTimer);const t=this.shadowRoot.querySelector(".lyrics-adjust-controls");t&&t.classList.add("touch-visible"),this._touchHideTimer=setTimeout((()=>{t&&t.classList.remove("touch-visible")}),3e3)})),t.addEventListener("touchend",(()=>{this._touchHideTimer&&clearTimeout(this._touchHideTimer),this._touchHideTimer=setTimeout((()=>{const t=this.shadowRoot.querySelector(".lyrics-adjust-controls");t&&t.classList.remove("touch-visible")}),1e3)})))}_touchStart(t){if(!this.config.show_floating_lyrics)return;const e=this.shadowRoot.querySelector(".floating-lyrics-container");if(!e)return;this._isDragging=!0;const i=t.touches[0];this._dragStartPos={x:i.clientX-e.offsetLeft,y:i.clientY-e.offsetTop},document.addEventListener("touchmove",this._touchMove,{passive:!1}),document.addEventListener("touchend",this._touchEnd),document.addEventListener("touchcancel",this._touchEnd)}_touchMove(t){if(!this._isDragging)return;t.preventDefault();const e=this.shadowRoot.querySelector(".floating-lyrics-container");if(!e)return;const i=t.touches[0],s=i.clientX-this._dragStartPos.x,r=i.clientY-this._dragStartPos.y,o=window.innerWidth-e.offsetWidth,n=window.innerHeight-e.offsetHeight,a=Math.max(0,Math.min(o,s)),c=Math.max(0,Math.min(n,r));this._floatingPosition={left:`${a}px`,top:`${c}px`,transform:"none",position:"fixed"},this.requestUpdate()}_touchEnd(){this._isDragging&&(this._isDragging=!1,this._savePosition(this._floatingPosition),document.removeEventListener("touchmove",this._touchMove),document.removeEventListener("touchend",this._touchEnd),document.removeEventListener("touchcancel",this._touchEnd))}_loadLyricsSettings(){const t={fontSize:window.innerWidth<=600?"18px":"24px",fontWeight:"600",fontFamily:"黑体",strokeColor:"#000000",textColor:"var(--primary-color)",customFontUrl:"https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@900&display=swap"};try{const e=localStorage.getItem("lyrics-settings");if(e){const i=JSON.parse(e);return i.fontSize||(i.fontSize=t.fontSize),{...t,...i}}return t}catch(e){return t}}_saveLyricsSettings(t){try{localStorage.setItem("lyrics-settings",JSON.stringify(t)),this._lyricsSettings=t,this.requestUpdate()}catch(t){logger.error("保存歌词设置失败:",t)}}_bindSettingsEvents(){this._handleDoubleClick=this._handleDoubleClick.bind(this),this._closeSettings=this._closeSettings.bind(this)}_handleDoubleClick(t){this.config.show_floating_lyrics&&(t.preventDefault(),this._showSettings=!0,this.requestUpdate())}_closeSettings(t){t&&t.target===t.currentTarget&&(this._showSettings=!1,this.requestUpdate())}_updateSetting(t,e){this._lyricsSettings;"textColor"!==t||e.startsWith("#")||(e=e.startsWith("var(--")?"#1976d2":e),this._lyricsSettings={...this._lyricsSettings,[t]:e},"customFontUrl"===t&&e&&(this._fontReady=!1,this._fontFacePromise=null,this._loadCustomFont(e)),this._saveLyricsSettings(this._lyricsSettings),this.requestUpdate()}_renderSettingsDialog(){if(!this._showSettings)return"";const t=this._loadLyricsSettings(),e=`\n      --text-color: ${t.textColor.startsWith("#")?t.textColor:"var(--primary-color)"};\n    `,i=[{name:"黑体",url:"https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@900&display=swap"},{name:"苹方",url:"https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400&display=swap"},{name:"ZCOOL QingKe HuangYou",url:"https://fonts.googleapis.com/css2?family=ZCOOL+QingKe+HuangYou&display=swap"},{name:"Ma Shan Zheng",url:"https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&display=swap"},{name:"ZCOOL KuaiLe",url:"https://fonts.googleapis.com/css2?family=ZCOOL+KuaiLe&display=swap"},{name:"ZCOOL XiaoWei",url:"https://fonts.googleapis.com/css2?family=ZCOOL+XiaoWei&display=swap"}];return html`
      <div class="settings-overlay" style="pointer-events:auto;" @pointerdown=${this._closeSettings}>
        <div 
          class="settings-dialog" 
          @pointerdown=${t=>t.stopPropagation()}
          style="${e}; pointer-events:auto;"
        >
          <div class="settings-header">
            <h3>歌词设置</h3>
            <ha-icon-button
              .path=${"M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41"}
              @click=${()=>{this._showSettings=!1,this.requestUpdate()}}
            ></ha-icon-button>
          </div>
          <div class="settings-content">
            <div class="settings-group">
              <div class="settings-item">
                <span>字体大小</span>
                <input 
                  type="number" 
                  min="12" 
                  max="72"
                  .value=${parseInt(t.fontSize)}
                  @change=${t=>this._updateSetting("fontSize",`${t.target.value}px`)}
                >
              </div>
              <div class="settings-item">
                <span>字体粗细</span>
                <ha-switch
                  .checked=${"bold"===t.fontWeight}
                  @change=${t=>this._updateSetting("fontWeight",t.target.checked?"bold":"normal")}
                ></ha-switch>
              </div>
            </div>
            <div class="settings-group">
              <div class="settings-item">
                <span>字体选择</span>
                <select
                  @change=${t=>{const e=i[t.target.value];this._updateSetting("customFontUrl",e.url),this._updateSetting("fontFamily",e.name)}}
                >
                  ${i.map(((e,i)=>html`
                    <option value="${i}" ?selected=${t.fontFamily===e.name}>
                      ${e.name}
                    </option>
                  `))}
                </select>
              </div>
            </div>
            <div class="settings-group">
              <div class="settings-item">
                <span>描边颜色</span>
                <input 
                  type="color"
                  .value=${t.strokeColor}
                  @change=${t=>this._updateSetting("strokeColor",t.target.value)}
                >
              </div>
              <div class="settings-item">
                <span>文字颜色</span>
                <input 
                  type="color"
                  .value=${t.textColor.startsWith("#")?t.textColor:"#1976d2"}
                  @change=${t=>this._updateSetting("textColor",t.target.value)}
                >
              </div>
            </div>
          </div>
        </div>
      </div>
    `}getGridOptions(){var t,e;return{columns:(null===(t=this.config.grid_options)||void 0===t?void 0:t.columns)||12,rows:(null===(e=this.config.grid_options)||void 0===e?void 0:e.rows)||6,min_rows:1}}_loadRepeatMode(){try{return localStorage.getItem("lyrics_repeat_mode")||"none"}catch(t){return"none"}}_saveRepeatMode(t){try{localStorage.setItem("lyrics_repeat_mode",t)}catch(t){logger.error("保存循环模式失败:",t)}}_toggleRepeatMode(){const t=["none","all","one","shuffle"],e=(t.indexOf(this._repeatMode)+1)%t.length;this._repeatMode=t[e],this._saveRepeatMode(this._repeatMode),this._setRepeatMode(this._repeatMode),this.requestUpdate()}_setRepeatMode(t){if(this.hass&&this.config.entity)if("shuffle"===t)this.hass.callService("media_player","shuffle_set",{entity_id:this.config.entity,shuffle:!0}),this.hass.callService("media_player","repeat_set",{entity_id:this.config.entity,repeat:"all"});else{let e;switch(this.hass.callService("media_player","shuffle_set",{entity_id:this.config.entity,shuffle:!1}),t){case"none":default:e="no_repeat";break;case"all":e="all";break;case"one":e="one"}this.hass.callService("media_player","repeat_set",{entity_id:this.config.entity,repeat:e})}}_loadShuffleMode(){try{return"true"===localStorage.getItem("lyrics_shuffle_mode")}catch(t){return!1}}_toggleShuffleMode(){this._shuffleMode=!this._shuffleMode,this._saveShuffleMode(this._shuffleMode),this._setShuffleMode(this._shuffleMode),this.requestUpdate()}_setShuffleMode(t){this.hass&&this.config.entity&&this.hass.callService("media_player","shuffle_set",{entity_id:this.config.entity,shuffle:t})}_getRepeatIcon(){switch(this._repeatMode){case"all":return"mdi:repeat";case"one":return"mdi:repeat-once";case"shuffle":return"mdi:shuffle";default:return"mdi:repeat-off"}}_shouldUseFixedHeight(){try{return"function"!=typeof window.CSS.supports||!window.CSS.supports("grid-template-rows","1fr")||!window.CSS.supports("display","grid")}catch(t){return!0}}_loadLyricFontSize(){try{const t=localStorage.getItem("lyrics_font_size");return t?parseInt(t):15}catch(t){return 15}}_saveLyricFontSize(t){try{localStorage.setItem("lyrics_font_size",t.toString()),localStorage.setItem("lyrics_font_size_active",(t+2).toString())}catch(t){logger.error("保存歌词字体大小失败:",t)}}_bindLyricsFontSizeEvents(){this._handleLyricsLongPress=this._handleLyricsLongPress.bind(this),this._closeFontSizeSlider=this._closeFontSizeSlider.bind(this)}_handleLyricsLongPress(t){t.preventDefault(),this._showFontSizeSlider=!0,this.requestUpdate(),this._fontSizeSliderTimer&&clearTimeout(this._fontSizeSliderTimer),this._fontSizeSliderTimer=setTimeout((()=>{this._showFontSizeSlider=!1,this.requestUpdate()}),5e3)}_closeFontSizeSlider(){this._showFontSizeSlider=!1,this._fontSizeSliderTimer&&(clearTimeout(this._fontSizeSliderTimer),this._fontSizeSliderTimer=null),this.requestUpdate()}_updateLyricFontSize(t){this._lyricFontSize=parseInt(t.target.value),this._lyricFontSizeActive=this._lyricFontSize+2,this._saveLyricFontSize(this._lyricFontSize),this.requestUpdate()}_renderFontSizeSlider(){return this._showFontSizeSlider?html`
      <div class="font-size-slider-container">
        <input 
          type="range" 
          min="12" 
          max="24"
          step="1"
          .value=${this._lyricFontSize}
          @input=${this._updateLyricFontSize}
          class="font-size-slider"
        >
      </div>
    `:""}_loadLyricFontSizeActive(){try{const t=localStorage.getItem("lyrics_font_size_active");return t?parseInt(t):this._loadLyricFontSize()+2}catch(t){return this._loadLyricFontSize()+2}}_loadLyricTimeOffset(){try{const t=localStorage.getItem("lyrics_time_offset");return t?parseFloat(t):0}catch(t){return 0}}_saveLyricTimeOffset(t){try{localStorage.setItem("lyrics_time_offset",t.toString())}catch(t){logger.error("保存歌词时间偏移失败:",t)}}_adjustLyricTime(t){this._lyricTimeOffset=Math.max(-5,Math.min(5,this._lyricTimeOffset+t)),this._saveLyricTimeOffset(this._lyricTimeOffset);const e=t>0?"+":"";this._showAdjustTooltip(`调整时间 ${e}${t}s (总偏移: ${this._lyricTimeOffset>0?"+":""}${this._lyricTimeOffset.toFixed(1)}s)`);const i=this.hass.states[this.config.entity];i&&i.attributes.media_position&&this.updateCurrentLyricIndex(i.attributes.media_position)}_showAdjustTooltip(t){this._adjustTipText=t,this._showAdjustTip=!0,this.requestUpdate(),this._adjustTipTimer&&clearTimeout(this._adjustTipTimer),this._adjustTipTimer=setTimeout((()=>{this._showAdjustTip=!1,this.requestUpdate()}),3e3)}_checkScrollHealth(){const t=Date.now();if(t-this._lastSuccessfulScroll>3e3){this._lastScrollTime=0,this._lastSuccessfulScroll=t;const e=this.hass.states[this.config.entity];e&&e.attributes.media_position&&this.updateCurrentLyricIndex(e.attributes.media_position),this.updateScroll()}}_toggleLyricsContainer(t){if(t.stopPropagation(),t.target.closest(".header-container")||t.target.closest(".card-header")){const e={...this.config,hide_lyrics_container:!this.config.hide_lyrics_container};this.config=e,this.performUpdate();try{localStorage.setItem(`lyrics_container_state_${this.config.entity}`,JSON.stringify({hidden:e.hide_lyrics_container,timestamp:Date.now()}))}catch(t){logger.error("保存歌词容器状态失败:",t)}requestAnimationFrame((()=>{const t=this.shadowRoot.querySelector(".lyrics-card");t&&(t.classList.add("transition-effect"),setTimeout((()=>{t.classList.remove("transition-effect")}),300))}))}}connectedCallback(){super.connectedCallback(),this.updateComplete.then((()=>{this._fixWidthIssue()})),window.addEventListener("popstate",(()=>this._fixWidthIssue())),window.addEventListener("location-changed",(()=>this._fixWidthIssue())),this.updateComplete.then((()=>{this._fixGridConflicts()})),window.addEventListener("location-changed",this._fixGridConflicts.bind(this))}_fixWidthIssue(){setTimeout((()=>{const t=this.shadowRoot.querySelector("ha-card");if(t){"150px"===window.getComputedStyle(t).width&&(t.style.width="100%",this.style.gridColumn="1 / span 12",t.style.gridColumn="1 / span 12")}}),0)}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("popstate",(()=>this._fixWidthIssue())),window.removeEventListener("location-changed",(()=>this._fixWidthIssue())),window.removeEventListener("location-changed",this._fixGridConflicts.bind(this)),this._fontSizeSliderTimer&&(clearTimeout(this._fontSizeSliderTimer),this._fontSizeSliderTimer=null)}_fixGridConflicts(){try{requestAnimationFrame((()=>{var t,e;const i=null===(t=this.shadowRoot)||void 0===t?void 0:t.querySelector("ha-card"),s=null===(e=this.shadowRoot)||void 0===e?void 0:e.querySelector(".card-header");if(i){i.style.gridColumn="1 / span 12",i.style.width="100%";window.getComputedStyle(i).gridTemplateColumns.includes("min-content")&&(i.style.gridTemplateColumns="1fr",i.style.gridTemplateAreas='"main"')}s&&(s.style.isolation="isolate"),this&&this.style&&(this.style.gridColumn="1 / span 12",this.style.width="100%")}))}catch(t){console.error("设置网格样式失败:",t)}}async _loadCustomFont(t){if(!t)return;if(fontUrlCache.has(t))return await fontUrlCache.get(t),this._fontReady=!0,void this.requestUpdate();let e=Array.from(document.querySelectorAll('link[rel="stylesheet"]')).find((e=>e.href===t));e||(e=document.createElement("link"),e.rel="stylesheet",e.href=t,document.head.appendChild(e));let i="Noto Sans SC";const s=t.match(/family=([^:&]+)/);s&&(i=decodeURIComponent(s[1].replace(/\+/g," ")));const r=document.fonts.load(`1em "${i}"`).then((()=>{this._fontReady=!0,this.requestUpdate()})).catch((()=>{this._fontReady=!0,this.requestUpdate()}));fontUrlCache.set(t,r),await r}_handlePointerDown(t){this.config.show_floating_lyrics&&("touch"!==t.pointerType&&"pen"!==t.pointerType||(this._longPressTimeout=setTimeout((()=>{this._showSettings=!0,this.requestUpdate()}),600)))}_handlePointerUp(t){this._longPressTimeout&&(clearTimeout(this._longPressTimeout),this._longPressTimeout=null)}_handlePointerCancel(t){this._longPressTimeout&&(clearTimeout(this._longPressTimeout),this._longPressTimeout=null)}}class NeteaseLyricsCardEditor extends LitElement{static get properties(){return{hass:{type:Object},_config:{type:Object},_mediaPlayers:{type:Array},_remoteVersion:{type:String}}}constructor(){super(),this._config={},this._mediaPlayers=[],this._remoteVersion="",this._fetchRemoteVersion()}async _fetchRemoteVersion(){try{const t=await fetch("https://api.github.com/repos/knoop7/lyrics-card/releases/latest");if(t.ok){const e=await t.json();this._remoteVersion=e.tag_name||(e.name?e.name:"")}else this._remoteVersion="获取失败"}catch(t){this._remoteVersion="获取失败"}this.requestUpdate()}setConfig(t){this._config={entity:"",...t},this._updateMediaPlayersList()}_updateMediaPlayersList(){this.hass&&(this._mediaPlayers=Object.keys(this.hass.states).filter((t=>t.startsWith("media_player."))).map((t=>{const e=this.hass.states[t],i=e.attributes.entity_picture;return{entityId:t,name:e.attributes.friendly_name||t.split(".")[1],icon:e.attributes.icon||"mdi:music",picture:i}})).sort(((t,e)=>t.name.localeCompare(e.name))))}updated(t){t.has("hass")&&this._updateMediaPlayersList()}render(){if(!this.hass)return html`<div>Loading...</div>`;const t="v1.2.5",e=this._remoteVersion;let i;if(e)if("获取失败"===e)i=html`
        <span class="ver-title">Lyrics Card ${t}</span>
        <span class="ver-divider">|</span>
        <span class="ver-remote ver-fail">
          <svg class="ver-warn" width="16" height="16" viewBox="0 0 24 24">
            <path fill="#e573a6" d="M1,21H23L12,2"/>
            <rect x="11" y="16" width="2" height="2" fill="#e573a6"/>
            <rect x="11" y="10" width="2" height="5" fill="#e573a6"/>
          </svg>
        </span>
      `;else{const s=function(t,e){const i=t.replace(/^v/i,"").split(".").map(Number),s=e.replace(/^v/i,"").split(".").map(Number);for(let t=0;t<Math.max(i.length,s.length);t++){const e=i[t]||0,r=s[t]||0;if(e>r)return 1;if(e<r)return-1}return 0}(t,e);let r;r=s>=0?html`
          <svg class="ver-check" width="16" height="16" viewBox="0 0 16 16">
            <polyline points="3,9 7,13 13,5" fill="none" stroke="#27ae60" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        `:html`
        <svg class="ver-update" width="16" height="16" viewBox="0 0 16 16">
          <polyline points="4,12 12,4" stroke="#e573a6" stroke-width="1.5" fill="none" stroke-linecap="round"/>
          <polyline points="7,4 12,4 12,9" stroke="#e573a6" stroke-width="1.5" fill="none" stroke-linecap="round"/>
        </svg>
        `,i=html`
        <span class="ver-title">Lyrics Card ${t}</span>
        <span class="ver-divider">|</span>
        <span class="ver-remote ${s>=0?"ver-green":"ver-pink"}">
          ${e}
          ${r}
        </span>
      `}else i=html`
        <span class="ver-title">Lyrics Card ${t}</span>
        <span class="ver-divider">|</span>
        <span class="ver-remote">
          <svg class="ver-spin" width="16" height="16" viewBox="0 0 50 50">
            <circle class="ver-path" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>
          </svg>
        </span>
      `;const s=html`
      <a class="version-link" href="https://github.com/knoop7/lyrics-card" target="_blank" rel="noopener">
        ${i}
      </a>
    `;return html`
      <div class="card-config">
        <div class="select-container">
          <div class="select-header select-header-flex">
            <span>选择媒体播放器</span>
            ${s}
          </div>
          <div class="select-content">
            ${this._mediaPlayers.map((t=>{const e=this.hass.states[t.entityId];let i;if(e&&e.attributes.media_title&&e.attributes.media_artist){let t=e.attributes.media_title;t.length>10&&(t=t.slice(0,10)+"..."),i=`${t} - ${e.attributes.media_artist}`}else i=t.entityId;var s,r,o,n,a,c;return html`
              <div 
                class="player-option ${this._config.entity===t.entityId?"selected":""}"
                @click=${()=>this._selectEntity(t.entityId)}
              >
                <div class="player-info">
                  ${t.picture?html`
                    <div class="player-avatar" style="background-image: url(${t.picture})"></div>
                  `:html`
                    <ha-icon icon="${t.icon}" class="player-icon"></ha-icon>
                  `}
                  <div class="player-details">
                    <div class="player-name">${t.name}</div>
                    <div class="player-id">${i}</div>
                  </div>
                </div>
                ${this._config.entity===t.entityId?html`
                  <div class="player-options">
                    <div class="options-group">
                      <div class="option-item">
                        <ha-switch
                          .checked=${null!==(s=this._config.show_background)&&void 0!==s&&s}
                          @change=${this._toggleBackground}
                        ></ha-switch>
                        <span class="option-label">显示背景</span>
                      </div>
                      <div class="option-item">
                        <ha-switch
                          .checked=${null!==(r=this._config.show_header)&&void 0!==r&&r}
                          @change=${this._toggleHeader}
                        ></ha-switch>
                        <span class="option-label">显示控制栏</span>
                      </div>
                      <div class="option-item">
                        <ha-switch
                          .checked=${null!==(o=this._config.show_karaoke)&&void 0!==o&&o}
                          @change=${this._toggleKaraoke}
                        ></ha-switch>
                        <span class="option-label">显示卡拉OK效果</span>
                      </div>
                      <div class="option-item">
                        <ha-switch
                          .checked=${null!==(n=this._config.show_floating_lyrics)&&void 0!==n&&n}
                          @change=${this._toggleFloatingLyrics}
                        ></ha-switch>
                        <span class="option-label">显示浮动歌词</span>
                      </div>
                      <div class="option-item">
                        <ha-switch
                          .checked=${null!==(a=this._config.hide_lyrics_container)&&void 0!==a&&a}
                          @change=${this._toggleHideLyricsContainer}
                        ></ha-switch>
                        <span class="option-label">显示单播放器</span>
                      </div>
                      <div class="option-item">
                        <ha-switch
                          .checked=${null!==(c=this._config.show_player_name)&&void 0!==c&&c}
                          @change=${this._togglePlayerName}
                        ></ha-switch>
                        <span class="option-label">显示播放器名称</span>
                      </div>
                    </div>
                  </div>
                `:""}
              </div>
            `}))}
          </div>
        </div>
      </div>
    `}_selectEntity(t){const e={...this._config,entity:t},i=new CustomEvent("config-changed",{bubbles:!0,composed:!0,detail:{config:e}});this.dispatchEvent(i),this._config=e}_toggleBackground(t){const e={...this._config,show_background:t.target.checked},i=new CustomEvent("config-changed",{bubbles:!0,composed:!0,detail:{config:e}});this.dispatchEvent(i),this._config=e}_toggleHeader(t){const e={...this._config,show_header:t.target.checked},i=new CustomEvent("config-changed",{bubbles:!0,composed:!0,detail:{config:e}});this.dispatchEvent(i),this._config=e}_toggleKaraoke(t){const e={...this._config,show_karaoke:t.target.checked},i=new CustomEvent("config-changed",{bubbles:!0,composed:!0,detail:{config:e}});this.dispatchEvent(i),this._config=e}_toggleFloatingLyrics(t){const e={...this._config,show_floating_lyrics:t.target.checked},i=new CustomEvent("config-changed",{bubbles:!0,composed:!0,detail:{config:e}});this.dispatchEvent(i),this._config=e}_toggleHideLyricsContainer(t){const e={...this._config,hide_lyrics_container:t.target.checked},i=new CustomEvent("config-changed",{bubbles:!0,composed:!0,detail:{config:e}});this.dispatchEvent(i),this._config=e}static get styles(){return css`
      .card-config {
        padding: 12px;
      }
      .select-container {
        background: var(--card-background-color);
        border-radius: 12px;
        overflow: hidden;
        box-shadow: var(--ha-card-box-shadow, none);
      }
      .select-header {
        padding: 10px;
        font-size: 16px;
        font-weight: 500;
        color: var(--primary-text-color);
        border-bottom: 1px solid var(--divider-color);
      }
      .select-header-flex {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }
      .version-link {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 500;
        color: #333;
        text-decoration: none;
        transition: text-decoration 0.2s;
        cursor: pointer;
        user-select: text;
        min-width: 90px;
        height: 24px;
      }
      .version-link:hover {
        text-decoration: underline;
      }
      .ver-title {
        color: #333;
        font-weight: 600;
      }
      .ver-divider {
        color: #bbb;
        margin: 0 4px;
        font-weight: 400;
      }
      .ver-remote {
        display: flex;
        align-items: center;
        gap: 2px;
        font-weight: 600;
      }
      .ver-green {
        color: #27ae60;
      }
      .ver-pink {
        color: #e573a6;
      }
      .ver-fail {
        color: #e573a6;
      }
      .ver-spin {
        animation: ver-spin 1s linear infinite;
        stroke: #27ae60;
      }
      .ver-spin .ver-path {
        stroke: #27ae60;
        stroke-linecap: round;
        stroke-dasharray: 90,150;
        stroke-dashoffset: 0;
      }
      @keyframes ver-spin {
        100% { transform: rotate(360deg);}
      }
      .ver-check {
        margin-left: 2px;
        vertical-align: middle;
      }
      .ver-update {
        margin-left: 2px;
        vertical-align: middle;
      }
      .ver-warn {
        margin-left: 2px;
        vertical-align: middle;
      }
      
      .select-content {
        max-height: 400px;
        overflow-y: auto;
        padding: 8px;
      }
      
      .player-option {
        display: flex;
        flex-direction: column;
        padding: 12px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        margin: 4px 0;
        background: var(--card-background-color);
      }
      
      .player-option.selected {
        background: var(--primary-color);
        padding-bottom: 16px;
      }
      
      .player-info {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .player-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background-size: cover;
        background-position: center;
      }
      
      .player-icon {
        --mdc-icon-size: 40px;
        color: var(--primary-color);
      }
      
      .selected .player-icon {
        color: var(--text-primary-color);
      }
      
      .player-details {
        flex: 1;
      }
      
      .player-name {
        font-size: 14px;
        font-weight: 500;
        color: var(--primary-text-color);
        margin-bottom: 2px;
      }
      
      .selected .player-name,
      .selected .player-id,
      .selected .option-label {
        color: var(--text-primary-color);
      }
      
      .player-id {
        font-size: 12px;
        color: var(--secondary-text-color);
        opacity: 0.7;
      }
      
      .player-options {
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .options-group {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      
      .option-item {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .option-label {
        font-size: 13px;
        color: var(--primary-text-color);
      }
      
      ha-switch {
        --mdc-theme-secondary: var(--text-primary-color);
      }

      .selected ha-switch {
        --mdc-theme-secondary: white;
      }
    `}_togglePlayerName(t){const e={...this._config,show_player_name:t.target.checked},i=new CustomEvent("config-changed",{bubbles:!0,composed:!0,detail:{config:e}});this.dispatchEvent(i),this._config=e}}customElements.get("netease-lyrics-card")||customElements.define("netease-lyrics-card",NeteaseLyricsCard),customElements.get("netease-lyrics-card-editor")||customElements.define("netease-lyrics-card-editor",NeteaseLyricsCardEditor),window.customCards=window.customCards||[],window.customCards.some((t=>"netease-lyrics-card"===t.type))||window.customCards.push({type:"netease-lyrics-card",name:"歌词lyrics",description:"音乐歌词卡片",preview:!0,documentationURL:"https://github.com/knoop7/lyrics-card"});
