/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

// This file contains the blog-specific plugins for the sidekick.
(() => {
  const sk = window.hlx && window.hlx.sidekick ? window.hlx.sidekick : window.hlxSidekick;
  console.log('plugins.js loaded', sk);
  if (typeof sk !== 'object') return;

  if (typeof sk.copyGlobal === 'function') {
  // copy globals for sidekick extension
    sk.copyGlobal('blog');
  }

  const path = sk.location.pathname;
  if (!path.includes('/publish/') && /\d{4}\/\d{2}\/\d{2}/.test(path)) {
    // post URL without publish in the path, add it back
    const segs = path.split('/');
    segs.splice(2, 0, 'publish')
    sk.location = new URL(segs.join('/'), sk.location.origin);
  }

  // PREVIEW ----------------------------------------------------------------------

  sk.add({
    id: 'preview',
    override: true,
    condition: (sidekick) => sidekick.isEditor() || (sidekick.isHelix() && sidekick.config.host),
    button: {
      action: () => {
        const { config, location } = sk;
        let url;
        if (sk.isEditor()) {
          url = new URL('https://adobeioruntime.net/api/v1/web/helix/helix-services/content-proxy@2.7.0');
          url.search = new URLSearchParams([
            ['owner', config.owner],
            ['repo', config.repo],
            ['ref', config.ref || 'main'],
            ['path', '/'],
            ['lookup', location.href],
          ]).toString();
        } else {
          const host = location.host === config.innerHost ? config.host : config.innerHost;
          url = new URL(`https://${host}${location.pathname}`);
        }
        window.open(url.toString(), `hlx-sk-preview-${btoa(location.href)}`);
      },
    },
  });

  // TAGGER -----------------------------------------------------------------------

  sk.add({
    id: 'tagger',
    condition: (sk) => sk.isEditor() && (sk.location.search.includes('.docx&') || sk.location.search.includes('.md&')),
    button: {
      text: 'Tagger',
      action: () => {
        const { config } = sk;
        window.open(`https://${config.host}/tools/tagger/`, 'hlx-sidekick-tagger');
      },
    },
  });

  // CARD PREVIEW -------------------------------------------------------------------

  function getCardData() {
    const d = getArticleData();
    return {
      date: new Date(d[1] * 1000).toLocaleDateString('en-US', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'UTC',
      }).replace(/\//g, '-'),
      hero: `${d[2]}?auto=webp&format=pjpg&optimize=medium&height=512&crop=3%3A2`,
      teaser: d[6],
      title: d[7],
      topic: [...(window.blog.allVisibleTopics || window.blog.topics)][0],
    };
  }

  function allowedPostPath(path) {
    return ![
      'documentation',
      'fpost',
    ].includes(path.split('/')[2]);
  }
  
  sk.add({
    id: 'card-preview',
    condition: (sidekick) => {
      return sidekick.isHelix()
        && window.blog.pageType === window.blog.TYPE.POST
        && allowedPostPath(sidekick.location.pathname);
    },
    button: {
      text: 'Card Preview',
      action: async (evt) => {
        const sk = window.hlx && window.hlx.sidekick ? window.hlx.sidekick : window.hlxSidekick;
        const btn = evt.target;
        let $modal = document.querySelector('.hlx-sk-overlay > div > .card');
        if ($modal) {
          sk.hideModal();
          btn.classList.remove('pressed');
        } else {
          sk.showModal('', true);
          const card = getCardData();
          $modal = document.querySelector('.hlx-sk-overlay > div');
          $modal.classList.remove('wait');
          $modal.innerHTML = `
          <div class="card">
          <div class="hero">
            <a href="#" title="${card.title}"><img src="${card.hero}" alt="${card.title}"></a>
          </div>
          <div class="content">
            <p class="topic"><a href="#" title="${card.topic}">${card.topic}</a></p>
            <h2><a href="#" title="${card.title}">${card.title}</a></h2>
            <p class="teaser"><a href="#" title="${card.teaser}">${card.teaser}</a></p>
            <p class="date">${card.date}</p>
          </div></div>
          `;
          function hideCardPreview() {
            sk.hideModal();
            btn.classList.remove('pressed');
          }
          $modal.parentElement.onclick = (evt) => {
            hideCardPreview();
            evt.target.onclick = null;
          };
          document.body.onkeydown = (evt) => {
            if (evt.key === 'Escape') {
              hideCardPreview();
              evt.target.onkeydown = null;
            }
          };
        
          const style = document.createElement('style');
          style.textContent = `
          .hlx-sk-overlay .card {
            width: 376px;
            box-shadow: var(--hlx-sk-shadow);
          }
          .hlx-sk-overlay > div {
            text-align: center;
            background-color: transparent;
            box-shadow: none;
          }`;
          $modal.appendChild(style);
          btn.classList.add('pressed');
        }
      },
    },
  });

  // PREDICTED URL ----------------------------------------------------------------

  function predictUrl(host, path) {
    const pathsplits = path.split('/');
    let publishPath = '';
    if (window.blog && window.blog.rawDate) {
      const datesplits = window.blog.rawDate.split('-');
      if (datesplits.length > 2) {
        publishPath = `/publish/${datesplits[2]}/${datesplits[0]}/${datesplits[1]}`;
      }
    }
    const filename = (pathsplits[pathsplits.length-1].split('.')[0]).toLowerCase().replace(/[^a-z\d_\/\.]/g,'-');
    return `${host ? `https://${host}/` : ''}${pathsplits[1]}${publishPath}/${filename}.html`;
  }
  
  sk.add({
    id: 'predicted-url',
    condition: (sidekick) => {
      const { config, location } = sidekick;
      return sidekick.isHelix()
        && window.blog.pageType === window.blog.TYPE.POST
        && config.host
        && location.host != config.host
        && allowedPostPath(location.pathname);
    },
    button: {
      text: 'Copy Predicted URL',
      action: (evt) => {
        const { config, location } = sk;
        const url = predictUrl(config.host, location.pathname);
        navigator.clipboard.writeText(url);
        sk.notify([
          'Predicted URL copied to clipboard:',
          url,
        ]);
      },
    },
  });

  // ARTICLE DATA -------------------------------------------------------------------

  function getArticleData() {
    return [
      window.blog.author,
      new Date(window.blog.date).getTime()/1000,
      `/hlx_${document.head.querySelector('meta[property="og:image"]')
        .getAttribute('content').split('/hlx_')[1]}`,
      predictUrl(null, sk.location.pathname),
      `["${window.blog.products.join('\", \"')}"]`,
      '0',
      document.querySelector('main>div:nth-of-type(4)').textContent.trim().substring(0, 75),
      document.title,
      `["${window.blog.topics.join('\", \"')}"]`,
    ];
  }

  sk.add({
    id: 'article-data',
    condition: (sidekick) => {
      return sidekick.isHelix() && window.blog.pageType === window.blog.TYPE.POST;
    },
    button: {
      text: 'Copy Article Data',
      action: async () => {
        try {
          navigator.clipboard.writeText(getArticleData().join('\t'));
          sk.notify('Article data copied to clipboard');
        } catch (e) {
          sk.notify([
            'Unable to copy article data:',
            e,
          ], 0);
        }
      },
    },
  });

  // PUBLISH ----------------------------------------------------------------------

  sk.add({
    id: 'publish',
    condition: (sidekick) => {
      // do not show publish button for drafts
      return sidekick.isHelix() && !sidekick.location.pathname.includes('/drafts/');
    },
  });

  // PUBLISH TAXONOMY & REDIRECTS--------------------------------------------------

  sk.add({
    id: 'publish-data',
    condition: (sk) => {
      const { config, location } = sk;
      return config.innerHost
        && config.host
        && sk.isEditor()
        && (location.search.includes('file=_taxonomy.xlsx') || location.search.includes('file=redirects.xlsx'));
    },
    override: true,
    button: {
      text: 'Publish',
      action: async () => {
        const { config } = sk;
        sk.showModal('Publishing data...', true);
        const url = new URL('https://adobeioruntime.net/api/v1/web/helix/helix-services/content-proxy@v2');
        url.search = new URLSearchParams([
          ['report', 'true'],
          ['owner', config.owner],
          ['repo', config.repo],
          ['ref', config.ref || 'main'],
          ['path', '/'],
          ['lookup', location.href],
        ]).toString();
        const resp = await fetch(url.toString());
        const json = await resp.json();
        if (!resp.ok || !json.unfriendlyWebUrl) {
          sk.notify('Failed to publish taxonomy. Please try again later.', 0);
          console.log('error', JSON.stringify(await resp.json()));
        }
        const path = new URL(json.unfriendlyWebUrl).pathname;
        const purge = await sk.publish(path);
        if (purge.ok) {
          await fetch(json.unfriendlyWebUrl, {cache: 'reload', mode: 'no-cors'});
          sk.notify('Data published');
        } else {
          sk.notify('Failed to publish data. Please try again later.', 0);
          console.log('error', JSON.stringify(purge));
        }
      },
    },
  });

})();
