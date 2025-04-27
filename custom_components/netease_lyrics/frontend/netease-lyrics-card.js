console.info(
  '%c ♪ Lyrics %c v1.2.0 ',
  'color: white; background: linear-gradient(90deg, #1DB954, rgb(29, 45, 185)); font-weight: bold; padding: 3px 6px; border-radius: 3px 0 0 3px; font-size: 10px; text-shadow: 0px 1px 0px rgba(0,0,0,0.2);',
  'color: white; background: #333; font-weight: bold; padding: 3px 6px; border-radius: 0 3px 3px 0; font-size: 10px;'
);

import {
  LitElement,
  html,
  css,
  unsafeCSS
} from "https://unpkg.com/lit-element@2.0.1/lit-element.js?module";

const logger = {
  info(msg) {
    console.log(`%c♪ %c${msg}`, 'color: #1DB954; font-weight: bold;', 'color: #666; font-style: italic;');
  },
  error(msg) {
    console.error(`%c♪ %c${msg}`, 'color: #f44336; font-weight: bold;', 'color: #f44336;');
  }
};



class NeteaseLyricsCard extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
      _lyrics: { type: Array },
      _currentIndex: { type: Number },
      _currentSong: { type: String },
      _currentArtist: { type: String },
      _musicSource: { type: String },
      _currentLyricProgress: { type: Number },
      _defaultDuration: { type: Number },
      _showBackground: { type: Boolean },
      style: { type: String, reflect: true },
      _floatingPosition: { type: Object },
      _isDragging: { type: Boolean },
      _isInitialUpdate: { type: Boolean },
      _showSettings: { type: Boolean },
      _lyricsSettings: { type: Object },
      _repeatMode: { type: String }
    };
  }

  constructor() {
    super();
    this._lyrics = [];
    this._currentIndex = -1;
    this._currentSong = "";
    this._currentArtist = "";
    this._rafId = null;
    this._lastUpdateTime = 0;
    this._lastScrollTime = 0;
    this._currentLyricProgress = 0;
    this._lyricsCache = new Map();
    this._initCache();
    this._visibilityHandler = this._handleVisibilityChange.bind(this);
    document.addEventListener('visibilitychange', this._visibilityHandler);
    this._floatingPosition = this._loadPosition();
    this._isDragging = false;
    this._bindDragEvents();
    this._bindTouchEvents();
    this._isInitialUpdate = true;
    this._showSettings = false;
    this._lyricsSettings = this._loadLyricsSettings();
    this._bindSettingsEvents();
    this._repeatMode = this._loadRepeatMode();
  }

  _initCache() {
    try {
      const cached = localStorage.getItem('netease_lyrics_cache');
      if (cached) {
        const data = JSON.parse(cached);
        const now = Date.now();
        Object.keys(data).forEach(key => {
          data[key].timestamp = now;
        });
        this._lyricsCache = new Map(Object.entries(data));
        this._saveCache();
      }
    } catch (e) {
      logger.error('初始化缓存失败:', e);
    }
  }

  _saveCache() {
    try {
      const cacheObj = Object.fromEntries(this._lyricsCache);
      localStorage.setItem('netease_lyrics_cache', JSON.stringify(cacheObj));
    } catch (e) {
      logger.error('保存缓存失败:', e);
    }
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error("请设置媒体播放器实体");
    }
    this.config = {
      ...config,
      show_background: config.show_background ?? true,
      show_header: config.show_header ?? true,
      show_karaoke: config.show_karaoke ?? true,
      show_floating_lyrics: config.show_floating_lyrics ?? false,
      hide_lyrics_container: config.hide_lyrics_container ?? false,
      grid_options: config.grid_options ?? { columns: 12, rows: 6 },
      view_layout: config.view_layout ?? {}
    };
  }

  updateCurrentLyricIndex(currentTime) {
    const timeMs = Math.floor(currentTime * 1000);
    const now = performance.now();

    if (!this._isInitialUpdate && now - this._lastUpdateTime < 16) {
      return;
    }
    this._lastUpdateTime = now;
    this._isInitialUpdate = false;

    let newIndex = -1;
    const len = this._lyrics.length;
    
    for (let i = 0; i < len; i++) {
      const lyric = this._lyrics[i];
      const nextLyric = this._lyrics[i + 1];
      
      if (!nextLyric || timeMs < nextLyric.time) {
        newIndex = i;
        break;
      }
    }

    if (newIndex === -1) {
      newIndex = this._lyrics.length - 1;
    }

    const updateProgress = (lyric, nextLyric) => {
      if (!nextLyric) {
        return 1;
      }

      const duration = nextLyric.time - lyric.time;
      return Math.max(0, Math.min(1, (timeMs - lyric.time) / duration));
    };

    if (this._currentIndex !== newIndex) {
      const newLyric = this._lyrics[newIndex];
      const nextLyric = this._lyrics[newIndex + 1];
      if (newLyric) {
        this._currentLyricProgress = updateProgress(newLyric, nextLyric);
      this._currentIndex = newIndex;
      this.requestUpdate();
        
        requestAnimationFrame(() => {
      this.updateScroll();
        });
      }
    } else if (this._currentIndex >= 0) {
      const currentLyric = this._lyrics[this._currentIndex];
      const nextLyric = this._lyrics[this._currentIndex + 1];
      this._currentLyricProgress = updateProgress(currentLyric, nextLyric);
      this.requestUpdate();
    }
  }

  updateScroll() {
    const now = performance.now();
    if (now - this._lastScrollTime < 16) {
      return;
    }
    this._lastScrollTime = now;

    const container = this.shadowRoot.querySelector('.lyrics-container');
    const activeElement = this.shadowRoot.querySelector('.lyric.active');
    
    if (container && activeElement) {
      const containerHeight = container.offsetHeight;
      const elementHeight = activeElement.offsetHeight;
      
      const targetScroll = Math.max(
        0,
        activeElement.offsetTop - (containerHeight - elementHeight) / 2
      );

      const currentScroll = container.scrollTop;
      
      if (Math.abs(targetScroll - currentScroll) > 10) {
        container.style.scrollBehavior = 'smooth';
        container.scrollTo({
          top: targetScroll,
          behavior: 'smooth'
        });
      } else {
        container.style.scrollBehavior = 'auto';
      container.scrollTop = targetScroll;
      }
    }
  }

  async updated(changedProps) {
    if (changedProps.has("hass")) {
      const state = this.hass.states[this.config.entity];
      
      if (state) {
        if (state.attributes.shuffle !== undefined && state.attributes.repeat) {
          let repeatMode;
          
          if (state.attributes.shuffle) {
            repeatMode = 'shuffle';
          } else {
            switch (state.attributes.repeat) {
              case 'all':
                repeatMode = 'all';
                break;
              case 'one':
                repeatMode = 'one';
                break;
              default:
                repeatMode = 'none';
            }
          }
          
          if (repeatMode !== this._repeatMode) {
            this._repeatMode = repeatMode;
            this._saveRepeatMode(repeatMode);
          }
        }
        
        const newSong = state.attributes.media_title;
        const newArtist = state.attributes.media_artist;
        const isPlaying = state.state === 'playing';
        
        if (newSong && newArtist && 
            (newSong !== this._currentSong || newArtist !== this._currentArtist)) {
          const now = Date.now();
          for (const [key, value] of this._lyricsCache.entries()) {
            if (now - value.timestamp > 3600000) {
              this._lyricsCache.delete(key);
            }
          }
          this._saveCache();
          
          this._currentSong = newSong;
          this._currentArtist = newArtist;
          await this.searchAndFetchLyrics(newSong, newArtist);
        }

        if (isPlaying && !this._rafId) {
          this.startTimer();
        } else if (!isPlaying && this._rafId) {
          this.stopTimer();
        }

        
        requestAnimationFrame(() => {
          const songInfo = this.shadowRoot.querySelector('.song-info');
          const titleContainer = this.shadowRoot.querySelector('.title-container');
          const artistContainer = this.shadowRoot.querySelector('.artist-container');
          
          if (songInfo && titleContainer && artistContainer) {
            const totalWidth = titleContainer.offsetWidth + artistContainer.offsetWidth;
            const containerWidth = songInfo.offsetWidth - 32; 
            
            if (totalWidth > containerWidth * 0.7) { 
              songInfo.style.justifyContent = 'center';
            } else {
              songInfo.style.justifyContent = 'flex-start';
            }
          }
        });
      }
    }
  }

  startTimer() {
    this.stopTimer();
    if (document.hidden) {
      this._switchToIntervalTimer();
    } else {
      this._switchToAnimationFrame();
    }
  }

  stopTimer() {
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    if (this._intervalId) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.stopTimer();
    document.removeEventListener('visibilitychange', this._visibilityHandler);
  }

  async fetchLyrics(title, artist) {
    try {
      const auth = this.hass.auth.data.access_token;
      if (!auth) {
        throw new Error('认证失败');
      }

      
      const maxRetries = 3;
      let lastError = null;
      
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const response = await fetch(
            `/api/netease_lyrics/lyrics?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`,
            {
              headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${auth}`,
                'Content-Type': 'application/json'
              },
              
              credentials: 'same-origin'
            }
          );

          
          if (response.ok) {
      const data = await response.json();
            if (!data.lyrics) {
              throw new Error('未找到歌词');
            }
            return data;
          }

          
          if (response.status === 401) {
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
            if (this.hass.auth.refreshAccessToken) {
              await this.hass.auth.refreshAccessToken();
              continue;
            }
          }

          lastError = new Error(`请求失败: ${response.status}`);
    } catch (error) {
          lastError = error;
          
          if (attempt < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
            continue;
          }
        }
      }

      
      throw lastError || new Error('获取歌词失败');
    } catch (error) {
      
      logger.error(`获取歌词失败: ${error.message}`);
      throw error;
    }
  }

  async searchAndFetchLyrics(title, artist) {
    try {
      const cleanTitle = title.replace(/\(.*?\)|\[.*?\]|（.*?）/g, '').trim();
      
      if (Array.isArray(artist)) {
        if (artist.length > 0) {
          artist = artist[0];
        } else {
          artist = "";
        }
      }
      
      const cleanArtist = artist.replace(/\(.*?\)|\[.*?\]|（.*?）/g, '').trim();
      const cacheKey = `${cleanTitle}-${cleanArtist}`;
      
      const cached = this._lyricsCache.get(cacheKey);
      if (cached) {
        if (cached.lyrics && !cached.lyrics.includes("搜索歌曲失败") && cached.lyrics.trim() !== "") {
          cached.timestamp = Date.now();
          this._lyricsCache.set(cacheKey, cached);
          this._saveCache();
          
          logger.info(`使用缓存的歌词: ${cleanTitle} - ${cleanArtist}`);
          this._lyrics = this.parseLyrics(cached.lyrics);
          
          const state = this.hass.states[this.config.entity];
          if (state && state.attributes.media_position) {
            this.updateCurrentLyricIndex(state.attributes.media_position);
          }
          
          this.requestUpdate();
          return;
        } else {
          this._lyricsCache.delete(cacheKey);
          this._saveCache();
          logger.info(`删除无效的歌词缓存: ${cleanTitle} - ${cleanArtist}`);
        }
      }


      const handleSpecialChars = (str) => {
        return str
          .replace(/[\s\-_～〜]+/g, ' ') 
          .replace(/[^\w\s\u4e00-\u9fa5]/g, '');  
      };
      
      const processTitle = (title) => {
        if (title.includes('/')) {
          return title.split('/')[0].trim(); 
        }
        if (title.includes('-')) {
          return title.split('-')[0].trim();
        }
        if (title.includes('feat')) {
          return title.split('feat')[0].trim();
        }
        return title;
      };
      
      const createSearchAttempts = (title, artist) => {
        const attempts = [];
        
        attempts.push({ title, artist });
        
        const simpleTitle = handleSpecialChars(title);
        const simpleArtist = handleSpecialChars(artist);
        
        if (simpleTitle !== title || simpleArtist !== artist) {
          attempts.push({ title: simpleTitle, artist: simpleArtist });
        }
        
        const processedTitle = processTitle(title);
        if (processedTitle !== title && processedTitle !== simpleTitle) {
          attempts.push({ title: processedTitle, artist });
        }
        
        const noSpaceTitle = title.replace(/\s+/g, '');
        const noSpaceArtist = artist.replace(/\s+/g, '');
        
        if (noSpaceTitle !== title) {
          attempts.push({ title: noSpaceTitle, artist });
        }
        
        if (noSpaceArtist !== artist) {
          attempts.push({ title, artist: noSpaceArtist });
        }
        
        attempts.push({ title: artist, artist: title });
        
        const uniqueAttempts = [];
        const seen = new Set();
        
        attempts.forEach(attempt => {
          const key = `${attempt.title}-${attempt.artist}`;
          if (!seen.has(key)) {
            seen.add(key);
            uniqueAttempts.push(attempt);
          }
        });
        
        return uniqueAttempts;
      };

      const searchAttempts = createSearchAttempts(cleanTitle, cleanArtist);

      for (let i = 0; i < searchAttempts.length; i++) {
        const attempt = searchAttempts[i];
        try {
          logger.info(`尝试搜索 (${i + 1}/${searchAttempts.length}): ${attempt.title} - ${attempt.artist}`);
          const response = await this.fetchLyrics(attempt.title, attempt.artist);
          
          if (response.lyrics && response.lyrics.trim() !== "") {
            this._lyricsCache.set(cacheKey, {
              lyrics: response.lyrics,
              timestamp: Date.now()
            });
            this._saveCache();
            
            this._lyrics = this.parseLyrics(response.lyrics);
            
            const state = this.hass.states[this.config.entity];
            if (state && state.attributes.media_position) {
              this.updateCurrentLyricIndex(state.attributes.media_position);
            }
            
            this.requestUpdate();
            return;
          }
        } catch (e) {
          if (i === searchAttempts.length - 1) {
            throw e;
          }
        }
      }

      throw new Error('未找到歌词');
    } catch (error) {
      logger.error(`搜索歌曲失败: ${error.message}`);
      this._lyrics = [{ time: 0, text: "搜索歌曲失败" }];
      
      const searchTitle = title.replace(/\(.*?\)|\[.*?\]|（.*?）/g, '').trim();
      const searchArtist = typeof artist === 'string' ? artist.replace(/\(.*?\)|\[.*?\]|（.*?）/g, '').trim() : 
                            (Array.isArray(artist) && artist.length > 0 ? artist[0].replace(/\(.*?\)|\[.*?\]|（.*?）/g, '').trim() : "");
      const cacheKey = `${searchTitle}-${searchArtist}`;
      
      if (this._lyricsCache.has(cacheKey)) {
        this._lyricsCache.delete(cacheKey);
        this._saveCache();
      }
      
      this.requestUpdate();
    }
  }

  parseLyrics(lrcText) {
    if (!lrcText) return [];
    
    const lines = lrcText.split('\n');
    const lyrics = [];
    const timeRegex = /\[(\d{2}):(\d{2})[\.\:](\d{2,3})\]/g;
    let totalInterval = 0;
    let intervalCount = 0;
    
    lines.forEach(line => {
      if (!line.trim()) return;
      
      const timeMatches = [...line.matchAll(timeRegex)];
      if (timeMatches.length > 0) {
        const text = line.replace(timeRegex, '').trim();
        if (!text) return;

        timeMatches.forEach(match => {
          const minutes = parseInt(match[1]);
          const seconds = parseInt(match[2]);
          const milliseconds = parseInt(match[3]);
          const time = minutes * 60000 + seconds * 1000 + 
            (match[3].length === 2 ? milliseconds * 10 : milliseconds);
          
          lyrics.push({ time, text });
        });
      }
    });
    
    lyrics.sort((a, b) => a.time - b.time);
    
    for (let i = 0; i < lyrics.length - 1; i++) {
      const interval = lyrics[i + 1].time - lyrics[i].time;
      if (interval > 500 && interval < 8000) {         totalInterval += interval;
        intervalCount++;
      }
    }
    
    const averageInterval = intervalCount > 0 ? totalInterval / intervalCount : 3000;
    
    let songTempo;
    if (averageInterval <= 2500) {
      songTempo = 'fast';
      this._defaultDuration = 2000;
    } else if (averageInterval <= 3500) {
      songTempo = 'medium';
      this._defaultDuration = 3000;
    } else {
      songTempo = 'slow';
      this._defaultDuration = 4000;
    }
    
    logger.info(`歌曲节奏: ${songTempo}, 平均间隔: ${Math.round(averageInterval)}ms`);
    return lyrics;
  }

  render() {
    const state = this.hass.states[this.config.entity];
    
    if (!state) {
      return html`
        <ha-card>
          <div class="empty-state">
            <ha-icon icon="mdi:help-circle-outline" class="empty-state-icon"></ha-icon>
            <div class="empty-state-text">
              <div class="empty-state-title">未找到媒体播放器</div>
              <div class="empty-state-subtitle">请在配置中设置正确的媒体播放器实体</div>
            </div>
          </div>
        </ha-card>`;
    }

    const position = state.attributes.media_position || 0;
    const positionUpdatedAt = new Date(state.attributes.media_position_updated_at).getTime();
    const timeDiff = Math.max(0, (Date.now() - positionUpdatedAt) / 1000);
    const duration = state.attributes.media_duration || 0;
    
    const currentPosition = Math.min(
      position + (state.state === 'playing' ? timeDiff : 0),
      duration
    );
    
    if (!state.attributes.media_title) {
      return html`
        <ha-card style="${this.config.hide_lyrics_container ? 
          '--card-height: fit-content; --container-height: auto; --show-border: none; padding-bottom: 8px; --background-top: -20px;' : 
          '--card-height: 100%; --container-height: 100%; --show-border: 1px solid rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.12); --background-top: 0;'}">
        ${this.config.show_background && state.attributes.entity_picture ? html`
          <div 
            class="card-background"
            style="background-image: url(${state.attributes.entity_picture})"
          ></div>
        ` : ''}
        <div class="card-container">
          ${this.config.show_header ? html`
            <div class="header-container">
              <div class="card-header">
                ${state.attributes.entity_picture ? html`
                  <div class="cover-image-container" @click=${() => this._showMoreInfo()}>
                    <div 
                      class="cover-image"
                      style="background-image: url(${state.attributes.entity_picture})"
                    ></div>
                    <div class="progress-ring" style="--progress: 0"></div>
                  </div>
                ` : ''}
                <div class="song-info">
                  <div class="title-container">
                    <div class="title">未播放</div>
                  </div>
                  <div class="artist-container">
                    <div class="artist">等待播放</div>
                  </div>
                </div>
                <div class="media-controls">
                  <button 
                    class="control-button" 
                    @click=${() => this._handleMediaAction('media_previous_track')}
                    ?disabled=${true}
                  >
                    <ha-icon icon="mdi:skip-previous"></ha-icon>
                  </button>
                  <button 
                    class="control-button" 
                    @click=${() => this._handleMediaAction('media_play_pause')}
                  >
                    <ha-icon icon="mdi:play"></ha-icon>
                  </button>
                  <button 
                    class="control-button" 
                    @click=${() => this._handleMediaAction('media_next_track')}
                    ?disabled=${true}
                  >
                    <ha-icon icon="mdi:skip-next"></ha-icon>
                  </button>
                  <button 
                    class="control-button repeat-button ${this._repeatMode !== 'none' ? 'active' : ''}" 
                    @click=${() => this._toggleRepeatMode()}
                    ?disabled=${true}
                  >
                    <ha-icon icon="${this._getRepeatIcon()}"></ha-icon>
                  </button>
                </div>
              </div>
            </div>
          ` : ''}
          ${!this.config.hide_lyrics_container ? html`
            <div class="empty-state">
              <ha-icon icon="mdi:music-note-off" class="empty-state-icon"></ha-icon>
              <div class="empty-state-text">
                <div class="empty-state-title">等待播放</div>
                <div class="empty-state-subtitle">从你的媒体播放器开始播放音乐</div>
              </div>
            </div>
          ` : ''}
        </div>
      </ha-card>`;
    }
    
    if (state.state === 'playing') {
      this.updateCurrentLyricIndex(currentPosition);
    }

    if (this._lyrics.length === 0) {
    return html`
      <ha-card style="${this.config.hide_lyrics_container ? 
          '--card-height: fit-content; --container-height: auto; --show-border: none; padding-bottom: 8px; --background-top: -20px;' : 
          '--card-height: 100%; --container-height: 100%; --show-border: 1px solid rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.12); --background-top: 0;'}">
        ${this.config.show_background && state.attributes.entity_picture ? html`
          <div 
            class="card-background"
            style="background-image: url(${state.attributes.entity_picture})"
          ></div>
        ` : ''}
        <div class="card-container">
          <div class="header-container">
        <div class="card-header">
              ${state.attributes.entity_picture ? html`
                <div class="cover-image-container" @click=${() => this._showMoreInfo()}>
                  <div 
                    class="cover-image"
                    style="background-image: url(${state.attributes.entity_picture})"
                  ></div>
                  <div 
                    class="progress-ring"
                    style="--progress: ${currentPosition / duration}"
                  ></div>
                </div>
              ` : ''}
          <div class="song-info">
                <div class="title-container">
            <div class="title">${state.attributes.media_title || "未知歌曲"}</div>
                </div>
                <div class="artist-container">
            <div class="artist">${state.attributes.media_artist || "未知艺术家"}</div>
          </div>
        </div>
              <div class="media-controls">
                <button 
                  class="control-button" 
                  @click=${() => this._handleMediaAction('media_previous_track')}
                >
                  <ha-icon icon="mdi:skip-previous"></ha-icon>
                </button>
                <button 
                  class="control-button" 
                  @click=${() => this._handleMediaAction('media_play_pause')}
                >
                  <ha-icon icon="${state.state === 'playing' ? 'mdi:pause' : 'mdi:play'}"></ha-icon>
                </button>
                <button 
                  class="control-button" 
                  @click=${() => this._handleMediaAction('media_next_track')}
                >
                  <ha-icon icon="mdi:skip-next"></ha-icon>
                </button>
                <button 
                  class="control-button repeat-button ${this._repeatMode !== 'none' ? 'active' : ''}" 
                  @click=${() => this._toggleRepeatMode()}
                >
                  <ha-icon icon="${this._getRepeatIcon()}"></ha-icon>
                </button>
              </div>
            </div>
          </div>
          ${!this.config.hide_lyrics_container ? html`
            <div class="empty-state">
              <ha-icon icon="mdi:sync" class="empty-state-icon spinning"></ha-icon>
              <div class="empty-state-text">
                <div class="empty-state-subtitle">正在加载歌词...</div>
              </div>
            </div>
          ` : ''}
        </div>
      </ha-card>`;
    }

    if (this._lyrics.length === 1 && this._lyrics[0].text.includes("搜索歌曲失败")) {
      return html`
        <ha-card style="${this.config.hide_lyrics_container ? 
          '--card-height: fit-content; --container-height: auto; --show-border: none; padding-bottom: 8px; --background-top: -20px;' : 
          '--card-height: 100%; --container-height: 100%; --show-border: 1px solid rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.12); --background-top: 0;'}">
        ${this.config.show_background && state.attributes.entity_picture ? html`
          <div 
            class="card-background"
            style="background-image: url(${state.attributes.entity_picture})"
          ></div>
        ` : ''}
        <div class="card-container">
          <div class="header-container">
            <div class="card-header">
              ${state.attributes.entity_picture ? html`
                <div class="cover-image-container" @click=${() => this._showMoreInfo()}>
                  <div 
                    class="cover-image"
                    style="background-image: url(${state.attributes.entity_picture})"
                  ></div>
                  <div 
                    class="progress-ring"
                    style="--progress: ${currentPosition / duration}"
                  ></div>
                </div>
              ` : ''}
              <div class="song-info">
                <div class="title-container">
                  <div class="title">${state.attributes.media_title || "未知歌曲"}</div>
                </div>
                <div class="artist-container">
                  <div class="artist">${state.attributes.media_artist || "未知艺术家"}</div>
                </div>
              </div>
              <div class="media-controls">
                <button 
                  class="control-button" 
                  @click=${() => this._handleMediaAction('media_previous_track')}
                >
                  <ha-icon icon="mdi:skip-previous"></ha-icon>
                </button>
                <button 
                  class="control-button" 
                  @click=${() => this._handleMediaAction('media_play_pause')}
                >
                  <ha-icon icon="${state.state === 'playing' ? 'mdi:pause' : 'mdi:play'}"></ha-icon>
                </button>
                <button 
                  class="control-button" 
                  @click=${() => this._handleMediaAction('media_next_track')}
                >
                  <ha-icon icon="mdi:skip-next"></ha-icon>
                </button>
                <button 
                  class="control-button repeat-button ${this._repeatMode !== 'none' ? 'active' : ''}" 
                  @click=${() => this._toggleRepeatMode()}
                >
                  <ha-icon icon="${this._getRepeatIcon()}"></ha-icon>
                </button>
              </div>
            </div>
          </div>
          ${!this.config.hide_lyrics_container ? html`
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
          ` : ''}
        </div>
      </ha-card>`;
    }

    const existingTemplate = html`
      <ha-card style="
        ${this.config.hide_lyrics_container ? 
          '--card-height: fit-content; --container-height: auto; --show-border: none; padding-bottom: 8px; --background-top: -20px;' : 
          '--card-height: 100%; --container-height: 100%; --show-border: 1px solid rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.12); --background-top: 0;'}
      ">
        ${this.config.show_background && state.attributes.entity_picture ? html`
          <div 
            class="card-background"
            style="background-image: url(${state.attributes.entity_picture})"
          ></div>
        ` : ''}
        <div class="card-container">
          ${this.config.show_header ? html`
            <div class="header-container">
              <div class="card-header">
                ${state.attributes.entity_picture ? html`
                  <div class="cover-image-container" @click=${() => this._showMoreInfo()}>
                    <div 
                      class="cover-image"
                      style="background-image: url(${state.attributes.entity_picture})"
                    ></div>
                    <div 
                      class="progress-ring"
                      style="--progress: ${currentPosition / duration}"
                    ></div>
                  </div>
                ` : ''}
                <div class="song-info">
                  <div class="title-container">
                    <div class="title">${state.attributes.media_title || "未知歌曲"}</div>
                  </div>
                  <div class="artist-container">
                    <div class="artist">${state.attributes.media_artist || "未知艺术家"}</div>
                  </div>
                </div>
                <div class="media-controls">
                  <button 
                    class="control-button" 
                    @click=${() => this._handleMediaAction('media_previous_track')}
                  >
                    <ha-icon icon="mdi:skip-previous"></ha-icon>
                  </button>
                  <button 
                    class="control-button" 
                    @click=${() => this._handleMediaAction('media_play_pause')}
                  >
                    <ha-icon icon="${state.state === 'playing' ? 'mdi:pause' : 'mdi:play'}"></ha-icon>
                  </button>
                  <button 
                    class="control-button" 
                    @click=${() => this._handleMediaAction('media_next_track')}
                  >
                    <ha-icon icon="mdi:skip-next"></ha-icon>
                  </button>
                  <button 
                    class="control-button repeat-button ${this._repeatMode !== 'none' ? 'active' : ''}" 
                    @click=${() => this._toggleRepeatMode()}
                  >
                    <ha-icon icon="${this._getRepeatIcon()}"></ha-icon>
                  </button>
                </div>
              </div>
            </div>
          ` : ''}
          ${!this.config.hide_lyrics_container ? html`
            <div class="content-container ${!this.config.show_header ? 'no-header' : ''}">
        <div class="card-content">
                <div class="lyrics-container ${!this.config.show_header ? 'no-header' : ''}">
          <div class="lyrics-top-spacer"></div>
            ${this._lyrics.map((lyric, index) => html`
                    <div 
                      class="lyric ${index === this._currentIndex ? 'active' : ''}"
                      style="${index === this._currentIndex && this.config.show_karaoke ? 
                        `--progress: ${this._currentLyricProgress * 100}%` : ''}"
                    >
                ${lyric.text}
              </div>
            `)}
                  <div class="lyrics-spacer"></div>
          </div>
              </div>
            </div>
          ` : ''}
        </div>
      </ha-card>
    `;

    if (this.config.show_floating_lyrics && this._lyrics.length > 0 && this._currentIndex >= 0) {
      const currentLyric = this._lyrics[this._currentIndex];
      const nextLyric = this._lyrics[this._currentIndex + 1];
      const duration = nextLyric ? (nextLyric.time - currentLyric.time) / 1000 : 2;
      const text = this._lyrics[this._currentIndex].text;
      const charCount = text.length;
      
      const baseDelay = duration / (charCount * 1.2);
      const progressPerChar = 1 / charCount;
      
      const floatingLyrics = html`
        <div class="floating-lyrics-container"
             style="${Object.entries(this._floatingPosition).map(([k, v]) => `${k}:${v}`).join(';')}"
             @mousedown=${this._dragStart}
             @touchstart=${this._touchStart}
             @dblclick=${this._handleDoubleClick}>
          <div class="floating-lyrics ${state.state === 'playing' ? 'playing' : ''}"
               style="
                 --progress: ${this._currentLyricProgress * 100}%;
                 --text-color: ${this._lyricsSettings.textColor.startsWith('#') ? this._lyricsSettings.textColor : 'var(--primary-color)'};
                 font-family: ${this._lyricsSettings.fontFamily}, var(--lyrics-font);
                 font-size: ${this._lyricsSettings.fontSize};
                 font-weight: ${this._lyricsSettings.fontWeight};
                 text-shadow: 0 1px 0 ${this._lyricsSettings.strokeColor},
                            1px 0 0 ${this._lyricsSettings.strokeColor},
                            -1px 0 0 ${this._lyricsSettings.strokeColor},
                            0 -1px 0 ${this._lyricsSettings.strokeColor};
               "
          >
            ${text.split('').map((char, index) => {
              const charDelay = index * baseDelay;
              const charProgress = this._currentLyricProgress * duration;
              return html`
                <span style="--duration: ${duration}s"
                      class="${charProgress >= charDelay ? 'active' : ''}"
                >${char}</span>
              `;
            })}
          </div>
        </div>
      `;
      
      return html`${existingTemplate}${floatingLyrics}${this._renderSettingsDialog()}`;
    }

    return existingTemplate;
  }

  static get styles() {
    const defaultHeight = '150';
    const previewHeight = '150';
    
    return css`
      :host {
        --lyrics-font: '黑体', 'Noto Sans SC', system-ui, -apple-system, BlinkMacSystemFont, 
                     "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans",
                     sans-serif, "Apple Color Emoji", "Segoe UI Emoji",
                     "Segoe UI Symbol", "Noto Color Emoji";
      }
      
      :host {
        display: block;
        height: 100%;
      }
      ha-card {
        padding: 8px 16px;
        height: ${unsafeCSS('var(--card-height, 100%)')};
        min-height: ${unsafeCSS('var(--card-min-height, auto)')};
        width: ${unsafeCSS(window.location.pathname.includes("config/dashboard") ? `${previewHeight}px` : 'auto')};
        overflow: hidden;
        display: flex;
        flex-direction: column;
        background: var(--ha-card-background, var(--card-background-color, white));
        border-radius: 20px;
        box-shadow: var(--ha-card-box-shadow, none);
        position: relative;
      }
      
      .card-background {
        position: absolute;
        top: ${unsafeCSS('var(--background-top, 0)')};
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
        height: ${unsafeCSS('var(--container-height, 100%)')};
        position: relative;
        z-index: 1;
      }

      .header-container {
        flex-shrink: 0;
        padding: 8px 0px 12px 0px;
        border-bottom: ${unsafeCSS('var(--show-border, 1px solid rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.12))')};
      }

      .content-container {
        flex: 1;
        overflow: hidden;
        display: flex;
        flex-direction: column;
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
        font-size: 15px;
        font-weight: 400;
        letter-spacing: -0.2px;
        transform: scale(0.98);
        color: var(--secondary-text-color);
        opacity: 0.6;
      }
      .lyric.active {
        opacity: 1;
        font-size: 17px;
        font-weight: 600;
        transform: scale(1);
        padding: 10px 26px;
        letter-spacing: -0.3px;
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
        gap: 4px;
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
        padding: 20px 40px;
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

        .floating-lyrics[style*="--progress"] span {
          margin: 0 0.5px;
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
    `;
  }

  getCardSize() {
    return this.config.show_header ? 4 : 3;
  }

  _handleVisibilityChange() {
    if (document.hidden) {
      this._switchToIntervalTimer();
    } else {
      this._switchToAnimationFrame();
    }
  }

  _switchToIntervalTimer() {
    this.stopTimer();
    this._intervalId = setInterval(() => {
      this.requestUpdate();
    }, 250);
  }

  _switchToAnimationFrame() {
    if (this._intervalId) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }
    
    let lastFrameTime = performance.now();
    
    const animate = () => {
      const now = performance.now();
      const deltaTime = now - lastFrameTime;
      
      if (deltaTime >= 16) {          this.requestUpdate();
        lastFrameTime = now;
      }
      
      this._rafId = requestAnimationFrame(animate);
    };
    
    this._rafId = requestAnimationFrame(animate);
  }

  static getConfigElement() {
    return document.createElement("netease-lyrics-card-editor");
  }

  static getStubConfig(hass) {
    const mediaPlayers = Object.keys(hass.states).filter(
      (eid) => eid.startsWith('media_player.')
    );
    
    return {
      entity: mediaPlayers.length > 0 ? mediaPlayers[0] : '',
      show_background: false,
      show_header: false,
      show_karaoke: false,
      show_floating_lyrics: false,
      hide_lyrics_container: false,
      grid_options: {
        columns: 12,
        rows: 6
      }
    };
  }

  _handleMediaAction(action) {
    this.hass.callService('media_player', action, {
        entity_id: this.config.entity
    });
  }

  _shouldScroll(text) {
    const tempElement = document.createElement('div');
    tempElement.style.visibility = 'hidden';
    tempElement.style.position = 'absolute';
    tempElement.style.whiteSpace = 'nowrap';
    tempElement.style.font = '15px montserrat';
    tempElement.textContent = text;
    document.body.appendChild(tempElement);
    
    const textWidth = tempElement.offsetWidth;
    document.body.removeChild(tempElement);
    
    return textWidth > 180;
  }

  _showMoreInfo() {
    const event = new CustomEvent("hass-more-info", {
        bubbles: true,
        composed: true,
        detail: {
            entityId: this.config.entity
        }
    });
    this.dispatchEvent(event);
  }

  _loadPosition() {
    try {
      const saved = localStorage.getItem('lyrics_floating_position');
      if (saved) {
        return JSON.parse(saved);
      }
      
      return this._calculateInitialPosition();
    } catch (e) {
      return this._calculateInitialPosition();
    }
  }

  _calculateInitialPosition() {
    const isMobile = window.innerWidth <= 600;
    const bottomMargin = isMobile ? 80 : 100;
    
    return {
      bottom: `${bottomMargin}px`,
      left: '50%',
      transform: 'translateX(-50%)',
      position: 'fixed'
    };
  }

  _savePosition(position) {
    localStorage.setItem('lyrics_floating_position', JSON.stringify(position));
  }

  _bindDragEvents() {
    this._dragStart = this._dragStart.bind(this);
    this._dragMove = this._dragMove.bind(this);
    this._dragEnd = this._dragEnd.bind(this);
  }

  _dragStart(e) {
    if (!this.config.show_floating_lyrics) return;
    const container = this.shadowRoot.querySelector('.floating-lyrics-container');
    if (!container) return;
    
    this._isDragging = true;
    this._dragStartPos = {
      x: e.clientX - container.offsetLeft,
      y: e.clientY - container.offsetTop
    };
    
    document.addEventListener('mousemove', this._dragMove);
    document.addEventListener('mouseup', this._dragEnd);
  }

  _dragMove(e) {
    if (!this._isDragging) return;
    const container = this.shadowRoot.querySelector('.floating-lyrics-container');
    if (!container) return;

    const newLeft = e.clientX - this._dragStartPos.x;
    const newTop = e.clientY - this._dragStartPos.y;
    
    const maxX = window.innerWidth - container.offsetWidth;
    const maxY = window.innerHeight - container.offsetHeight;
    
    const boundedLeft = Math.max(0, Math.min(maxX, newLeft));
    const boundedTop = Math.max(0, Math.min(maxY, newTop));
    
    this._floatingPosition = {
      left: `${boundedLeft}px`,
      top: `${boundedTop}px`,
      transform: 'none',
      position: 'fixed'
    };
    
    this.requestUpdate();
  }

  _dragEnd() {
    if (!this._isDragging) return;
    this._isDragging = false;
    this._savePosition(this._floatingPosition);
    
    document.removeEventListener('mousemove', this._dragMove);
    document.removeEventListener('mouseup', this._dragEnd);
  }

  _bindTouchEvents() {
    this._touchStart = this._touchStart.bind(this);
    this._touchMove = this._touchMove.bind(this);
    this._touchEnd = this._touchEnd.bind(this);
  }

  _touchStart(e) {
    if (!this.config.show_floating_lyrics) return;
    const container = this.shadowRoot.querySelector('.floating-lyrics-container');
    if (!container) return;
    
    this._isDragging = true;
    const touch = e.touches[0];
    this._dragStartPos = {
      x: touch.clientX - container.offsetLeft,
      y: touch.clientY - container.offsetTop
    };
    
    document.addEventListener('touchmove', this._touchMove, { passive: false });
    document.addEventListener('touchend', this._touchEnd);
    document.addEventListener('touchcancel', this._touchEnd);
  }

  _touchMove(e) {
    if (!this._isDragging) return;
    e.preventDefault();
    
    const container = this.shadowRoot.querySelector('.floating-lyrics-container');
    if (!container) return;

    const touch = e.touches[0];
    const newLeft = touch.clientX - this._dragStartPos.x;
    const newTop = touch.clientY - this._dragStartPos.y;
    
    const maxX = window.innerWidth - container.offsetWidth;
    const maxY = window.innerHeight - container.offsetHeight;
    
    const boundedLeft = Math.max(0, Math.min(maxX, newLeft));
    const boundedTop = Math.max(0, Math.min(maxY, newTop));
    
    this._floatingPosition = {
      left: `${boundedLeft}px`,
      top: `${boundedTop}px`,
      transform: 'none',
      position: 'fixed'
    };
    
    this.requestUpdate();
  }

  _touchEnd() {
    if (!this._isDragging) return;
    this._isDragging = false;
    this._savePosition(this._floatingPosition);
    
    document.removeEventListener('touchmove', this._touchMove);
    document.removeEventListener('touchend', this._touchEnd);
    document.removeEventListener('touchcancel', this._touchEnd);
  }

  _loadLyricsSettings() {
    const defaultSettings = {
      fontSize: '24px',
      fontWeight: '600',
      fontFamily: '黑体',
      strokeColor: '#000000',
      textColor: 'var(--primary-color)',
      customFontUrl: 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@900&display=swap'
    };
    
    try {
      const savedSettings = localStorage.getItem('lyrics-settings');
      return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
    } catch (e) {
      return defaultSettings;
    }
  }

  _saveLyricsSettings(settings) {
    try {
      localStorage.setItem('lyrics-settings', JSON.stringify(settings));
      this._lyricsSettings = settings;
      this.requestUpdate();
    } catch (e) {
      logger.error('保存歌词设置失败:', e);
    }
  }

  _bindSettingsEvents() {
    this._handleDoubleClick = this._handleDoubleClick.bind(this);
    this._closeSettings = this._closeSettings.bind(this);
  }

  _handleDoubleClick(e) {
    if (!this.config.show_floating_lyrics) return;
    e.preventDefault();
    this._showSettings = true;
    this.requestUpdate();
  }

  _closeSettings(e) {
    if (e && e.target === e.currentTarget) {
      this._showSettings = false;
      this.requestUpdate();
    }
  }

  _updateSetting(key, value) {
    const oldSettings = { ...this._lyricsSettings };
    
    if (key === 'textColor' && !value.startsWith('#')) {
      value = value.startsWith('var(--') ? '#1976d2' : value;
    }
    
    this._lyricsSettings = {
      ...this._lyricsSettings,
      [key]: value
    };
    
    this._saveLyricsSettings(this._lyricsSettings);
    this.requestUpdate();
  }

  _renderSettingsDialog() {
    if (!this._showSettings) return '';
    
    const settings = this._loadLyricsSettings();
    const style = `
      --text-color: ${settings.textColor.startsWith('#') ? settings.textColor : 'var(--primary-color)'};
    `;
    
    const fontOptions = [
      { name: '黑体', url: 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@900&display=swap' },
      { name: '苹方', url: 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400&display=swap' },
      { name: 'ZCOOL QingKe HuangYou', url: 'https://fonts.googleapis.com/css2?family=ZCOOL+QingKe+HuangYou&display=swap' },
      { name: 'Ma Shan Zheng', url: 'https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&display=swap' },
      { name: 'ZCOOL KuaiLe', url: 'https://fonts.googleapis.com/css2?family=ZCOOL+KuaiLe&display=swap' },
      { name: 'ZCOOL XiaoWei', url: 'https://fonts.googleapis.com/css2?family=ZCOOL+XiaoWei&display=swap' }
    ];
    
    return html`
      <div class="settings-overlay">
        <div 
          class="settings-dialog" 
          @click=${e => e.stopPropagation()}
          style="${style}"
        >
          <div class="settings-header">
            <h3>歌词设置</h3>
            <ha-icon-button
              .path=${"M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41"}
              @click=${() => { this._showSettings = false; this.requestUpdate(); }}
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
                  .value=${parseInt(settings.fontSize)}
                  @change=${e => this._updateSetting('fontSize', `${e.target.value}px`)}
                >
              </div>
              <div class="settings-item">
                <span>字体粗细</span>
                <ha-switch
                  .checked=${settings.fontWeight === 'bold'}
                  @change=${e => this._updateSetting('fontWeight', e.target.checked ? 'bold' : 'normal')}
                ></ha-switch>
              </div>
            </div>
            <div class="settings-group">
              <div class="settings-item">
                <span>字体选择</span>
                <select
                  @change=${e => {
                    const selectedFont = fontOptions[e.target.value];
                    this._updateSetting('customFontUrl', selectedFont.url);
                    this._updateSetting('fontFamily', selectedFont.name);
                  }}
                >
                  ${fontOptions.map((font, index) => html`
                    <option value="${index}" ?selected=${settings.fontFamily === font.name}>
                      ${font.name}
                    </option>
                  `)}
                </select>
              </div>
            </div>
            <div class="settings-group">
              <div class="settings-item">
                <span>描边颜色</span>
                <input 
                  type="color"
                  .value=${settings.strokeColor}
                  @change=${e => this._updateSetting('strokeColor', e.target.value)}
                >
              </div>
              <div class="settings-item">
                <span>文字颜色</span>
                <input 
                  type="color"
                  .value=${settings.textColor.startsWith('#') ? settings.textColor : '#1976d2'}
                  @change=${e => this._updateSetting('textColor', e.target.value)}
                >
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  getGridOptions() {
    return {
      columns: this.config.grid_options?.columns || 12,
      rows: this.config.grid_options?.rows || 6,
      min_rows: 4
    };
  }

  _loadRepeatMode() {
    try {
      const saved = localStorage.getItem('lyrics_repeat_mode');
      return saved || 'none';
    } catch (e) {
      return 'none';
    }
  }

  _saveRepeatMode(mode) {
    try {
      localStorage.setItem('lyrics_repeat_mode', mode);
    } catch (e) {
      logger.error('保存循环模式失败:', e);
    }
  }

  _toggleRepeatMode() {
    const modes = ['none', 'all', 'one', 'shuffle'];
    const currentIndex = modes.indexOf(this._repeatMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    this._repeatMode = modes[nextIndex];
    this._saveRepeatMode(this._repeatMode);
    
    this._setRepeatMode(this._repeatMode);
    
    this.requestUpdate();
  }

  _setRepeatMode(mode) {
    if (!this.hass || !this.config.entity) return;
    
    if (mode === 'shuffle') {
      this.hass.callService('media_player', 'shuffle_set', {
        entity_id: this.config.entity,
        shuffle: true
      });
      this.hass.callService('media_player', 'repeat_set', {
        entity_id: this.config.entity,
        repeat: 'all'
      });
    } else {
      this.hass.callService('media_player', 'shuffle_set', {
        entity_id: this.config.entity,
        shuffle: false
      });
      
      let repeatMode;
      switch (mode) {
        case 'none':
          repeatMode = 'no_repeat';
          break;
        case 'all':
          repeatMode = 'all';
          break;
        case 'one':
          repeatMode = 'one';
          break;
        default:
          repeatMode = 'no_repeat';
      }
      
      this.hass.callService('media_player', 'repeat_set', {
        entity_id: this.config.entity,
        repeat: repeatMode
      });
    }
  }

  _loadShuffleMode() {
    try {
      const saved = localStorage.getItem('lyrics_shuffle_mode');
      return saved === 'true';
    } catch (e) {
      return false;
    }
  }

  _toggleShuffleMode() {
    this._shuffleMode = !this._shuffleMode;
    this._saveShuffleMode(this._shuffleMode);
    
    this._setShuffleMode(this._shuffleMode);
    
    this.requestUpdate();
  }

  _setShuffleMode(mode) {
    if (!this.hass || !this.config.entity) return;
    
    this.hass.callService('media_player', 'shuffle_set', {
      entity_id: this.config.entity,
      shuffle: mode
    });
  }

  _getRepeatIcon() {
    switch(this._repeatMode) {
      case 'all':
        return 'mdi:repeat';
      case 'one':
        return 'mdi:repeat-once';
      case 'shuffle':
        return 'mdi:shuffle';
      default:
        return 'mdi:repeat-off';
    }
  }
}

class NeteaseLyricsCardEditor extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      _config: { type: Object },
      _mediaPlayers: { type: Array },
    };
  }

  constructor() {
    super();
    this._config = {};
    this._mediaPlayers = [];
  }

  setConfig(config) {
    this._config = {
      entity: '',
      ...config
    };
    this._updateMediaPlayersList();
  }

  _updateMediaPlayersList() {
    if (!this.hass) return;
    
    this._mediaPlayers = Object.keys(this.hass.states)
      .filter(entityId => entityId.startsWith('media_player.'))
      .map(entityId => {
        const state = this.hass.states[entityId];
        const entityPicture = state.attributes.entity_picture;
        return {
          entityId,
          name: state.attributes.friendly_name || entityId.split('.')[1],
          icon: state.attributes.icon || 'mdi:music',
          picture: entityPicture
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  updated(changedProps) {
    if (changedProps.has('hass')) {
      this._updateMediaPlayersList();
    }
  }

  render() {
    if (!this.hass) {
      return html`<div>Loading...</div>`;
    }

    return html`
      <div class="card-config">
        <div class="select-container">
          <div class="select-header">选择媒体播放器</div>
          <div class="select-content">
            ${this._mediaPlayers.map(player => html`
              <div 
                class="player-option ${this._config.entity === player.entityId ? 'selected' : ''}"
                @click=${() => this._selectEntity(player.entityId)}
              >
                <div class="player-info">
                  ${player.picture ? html`
                    <div class="player-avatar" style="background-image: url(${player.picture})"></div>
                  ` : html`
                    <ha-icon icon="${player.icon}" class="player-icon"></ha-icon>
                  `}
                  <div class="player-details">
                    <div class="player-name">${player.name}</div>
                    <div class="player-id">${player.entityId}</div>
                  </div>
                </div>
                ${this._config.entity === player.entityId ? html`
                  <div class="player-options">
                    <div class="options-group">
                      <div class="option-item">
                        <ha-switch
                          .checked=${this._config.show_background ?? false}
                          @change=${this._toggleBackground}
                        ></ha-switch>
                        <span class="option-label">显示背景</span>
                      </div>
                      <div class="option-item">
                        <ha-switch
                          .checked=${this._config.show_header ?? false}
                          @change=${this._toggleHeader}
                        ></ha-switch>
                        <span class="option-label">显示控制栏</span>
                      </div>
                      <div class="option-item">
                        <ha-switch
                          .checked=${this._config.show_karaoke ?? false}
                          @change=${this._toggleKaraoke}
                        ></ha-switch>
                        <span class="option-label">显示卡拉OK效果</span>
                      </div>
                      <div class="option-item">
                        <ha-switch
                          .checked=${this._config.show_floating_lyrics ?? false}
                          @change=${this._toggleFloatingLyrics}
                        ></ha-switch>
                        <span class="option-label">显示浮动歌词</span>
                      </div>
                      <div class="option-item">
                        <ha-switch
                          .checked=${this._config.hide_lyrics_container ?? false}
                          @change=${this._toggleHideLyricsContainer}
                        ></ha-switch>
                        <span class="option-label">隐藏歌词容器</span>
                      </div>
                    </div>
                  </div>
                ` : ''}
              </div>
            `)}
          </div>
        </div>
      </div>
    `;
  }

  _selectEntity(entityId) {
    const newConfig = {
      ...this._config,
      entity: entityId
    };

    const event = new CustomEvent("config-changed", {
      bubbles: true,
      composed: true,
      detail: { config: newConfig }
    });
    this.dispatchEvent(event);
    this._config = newConfig;
  }

  _toggleBackground(ev) {
    const newConfig = {
      ...this._config,
      show_background: ev.target.checked
    };

    const event = new CustomEvent("config-changed", {
      bubbles: true,
      composed: true,
      detail: { config: newConfig }
    });
    this.dispatchEvent(event);
    this._config = newConfig;
  }

  _toggleHeader(ev) {
    const newConfig = {
      ...this._config,
      show_header: ev.target.checked
    };

    const event = new CustomEvent("config-changed", {
      bubbles: true,
      composed: true,
      detail: { config: newConfig }
    });
    this.dispatchEvent(event);
    this._config = newConfig;
  }

  _toggleKaraoke(ev) {
    const newConfig = {
      ...this._config,
      show_karaoke: ev.target.checked
    };

    const event = new CustomEvent("config-changed", {
      bubbles: true,
      composed: true,
      detail: { config: newConfig }
    });
    this.dispatchEvent(event);
    this._config = newConfig;
  }

  _toggleFloatingLyrics(ev) {
    const newConfig = {
      ...this._config,
      show_floating_lyrics: ev.target.checked
    };

    const event = new CustomEvent("config-changed", {
      bubbles: true,
      composed: true,
      detail: { config: newConfig }
    });
    this.dispatchEvent(event);
    this._config = newConfig;
  }

  _toggleHideLyricsContainer(ev) {
    const newConfig = {
      ...this._config,
      hide_lyrics_container: ev.target.checked
    };

    const event = new CustomEvent("config-changed", {
      bubbles: true,
      composed: true,
      detail: { config: newConfig }
    });
    this.dispatchEvent(event);
    this._config = newConfig;
  }

  static get styles() {
    return css`
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
        padding: 16px;
        font-size: 16px;
        font-weight: 500;
        color: var(--primary-text-color);
        border-bottom: 1px solid var(--divider-color);
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
    `;
  }
}

if (!customElements.get('netease-lyrics-card')) {
customElements.define("netease-lyrics-card", NeteaseLyricsCard);
}

if (!customElements.get('netease-lyrics-card-editor')) {
  customElements.define("netease-lyrics-card-editor", NeteaseLyricsCardEditor);
}

window.customCards = window.customCards || [];
if (!window.customCards.some(card => card.type === 'netease-lyrics-card')) {
window.customCards.push({
  type: "netease-lyrics-card",
    name: "歌词lyrics",
    description: "优雅的音乐歌词卡片",
    preview: true,
    documentationURL: "https://github.com/knoop7/netease-lyrics-card"
  });
} 