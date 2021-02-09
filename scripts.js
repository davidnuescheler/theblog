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
/**
 * Loads a JS module.
 * @param {string} src The path to the JS module
 */
function loadJSModule(src) {
  const module = document.createElement('script');
  module.setAttribute('type', 'module');
  module.setAttribute('src', src);
  document.head.appendChild(module);
};

/**
 * Loads a CSS file.
 * @param {string} href The path to the CSS file
 */
function loadCSS(href) {
  const link = document.createElement('link');
  link.setAttribute('rel', 'stylesheet');
  link.setAttribute('href', href);
  document.head.appendChild(link);
};


function checkDX(tags) {
  const dxtags=`Experience Cloud, Experience Manager, Magento Commerce, Marketo Engage, Target, Commerce Cloud, Campaign, Audience Manager, Analytics, Advertising Cloud,
      Travel & Hospitality, Media & Entertainment, Financial Services, Government, Non-profits, Other, Healthcare, High Tech, Retail, Telecom, Manufacturing, Education,
      B2B, Social, Personalization, Campaign Management, Content Management, Email Marketing, Commerce, Analytics, Advertising, Digital Transformation`;
  const dx=dxtags.split(',').map(e => e.trim());
  let found=false;
  tags.split(',').forEach((p) => {
    p=p.trim();
    if (dx.includes(p)) found=true;
  });
  return found;
}

/**
 * sets marketing tech context
 */

function setMarTechContext() {
  var env='dev';
  var hostname=window.location.hostname;
  if (hostname.includes('staging')) env='stage';
  if (hostname == 'blog.adobe.com') env='production';

  var isDX=false;
  document.querySelectorAll('main>div:last-of-type>p').forEach(($p) => {
    if ($p.innerHTML.includes('Products:') || $p.innerHTML.includes('Topics:')) {
      if (checkDX($p.innerHTML.split(':')[1])) {
        isDX=true;
      }
    }
  });

  var accounts='';
  if (isDX) {
    if (env == 'production') {
      accounts='adbadobedxprod';
    }
    if (env == 'stage') {
      accounts='adbadobedxqa';
    }
  }

  window.marketingtech = {
    adobe: {
      launch: {
        property: 'global',
        environment: env  // “production” for prod/live site or “stage” for qa/staging site
      },
      analytics: {
        additionalAccounts: accounts // additional report suites to send data to “,” separated  Ex: 'RS1,RS2'
      },
      target: true,    // if target needs to be enabled else false
      audienceManager: true    // if audience manager needs to be enabled else false
    }
  };
  // console.log(window.marketingtech)
}

/**
 * sets digital data
 */

function setDigitalData() {
  var langMap={'en': 'en-US'};
  var lang=window.blog.language;
  if (langMap[lang]) lang=langMap[lang];
  digitalData._set('page.pageInfo.language', lang);
  // console.log(lang);
}

/**
 * Return the correct CMP integration ID based on the domain name
 */
function getOtDomainId() {
  const domains = {
    'adobe.com': '7a5eb705-95ed-4cc4-a11d-0cc5760e93db',
    'hlx.page': '3a6a37fe-9e07-4aa9-8640-8f358a623271',
    'project-helix.page': '45a95a10-dff7-4048-a2f3-a235b5ec0492',
    'helix-demo.xyz': 'ff276bfd-1218-4a19-88d4-392a537b6ce3',
    'adobeaemcloud.com': '70cd62b6-0fe3-4e20-8788-ef0435b8cdb1',
  };
  const currentDomain = Object.keys(domains).find(domain => window.location.host.indexOf(domain) > -1);

  return `${domains[currentDomain] || domains[Object.keys(domains)[0]]}`;
};

/**
 * Returns an image URL with optimization parameters
 * @param {string} url The image URL
 * @param {object} options The configuration options
 */
function getOptimizedImageUrl(url, config) {
  const [path, query] = url.split('?');
  if (!path.endsWith('.gif')) {
    // apply defaults
    config =  {
      auto: 'webp',
      format: 'pjpg',
      optimize: 'medium',
      ...config,
    }
  }
  const opts = new URLSearchParams(query);
  Object.keys(config).forEach(key => config[key] ? opts.set(key, config[key]) : null); 
  return `${path}?${opts.toString()}`;
}

// Blog config
window.blog = function() {
  const TYPE = {
    HOME: 'home',
    POST: 'post',
    AUTHOR: 'author',
    TOPIC: 'topic',
    PRODUCT: 'product',
    BLANK: 'blank',
  };
  const LANG = {
    EN: 'en',
    DE: 'de',
    FR: 'fr',
    KO: 'ko',
    ES: 'es',
    IT: 'it',
    JP: 'jp',
    BR: 'br',
  };
  const context = '/';
  let language = LANG.EN;
  let pageType = TYPE.HOME;
  const segs = window.location.pathname
    .split('/')
    .filter(seg => seg !== '');
  if (segs.length > 0) {
    if (segs.length >= 1) {
      // language
      for (let [key, value] of Object.entries(LANG)) {
        if (value === segs[0]) {
          language = value;
          break;
        }
      }
    }
    if (segs.length >= 2) {
      // post pages
      if (segs[1] === 'drafts' || segs[1] === 'publish' || segs[1] === 'fpost' || segs[1] === 'documentation' || /\d{4}\/\d{2}\/\d{2}/.test(segs.join('/'))) {
        pageType = TYPE.POST;
      } else {
        for (let [key, value] of Object.entries(TYPE)) {
          if (segs[1].startsWith(value)) {
            pageType = value;
            break;
          }
        }
      }
    }
  }
  if (window.isErrorPage) {
    pageType = TYPE.BLANK;
  }
  return { context, language, pageType, TYPE, LANG };
}();

// Adobe config
window.fedsMapping = {
  ko: 'kr'
};

window.fedsConfig = {
  locale: window.fedsMapping[window.blog.language] || window.blog.language,
  content: {
    experience: 'blogs/blog-gnav',
  },
  search: {
    context: 'blogs',
    passExperienceName: true,
  },
  disableSticky: false,
  privacy: {
    otDomainId: getOtDomainId(),
    footerLinkSelector: '[data-feds-action="open-adchoices-modal"]',
  },
};

window.adobeid = {
  client_id: 'theblog-helix',
  scope: 'AdobeID,openid',
  locale: window.blog.language,
};

/**
 * Set up a click event on Region Picker
 */
function handleDropdownRegion() {
  const regionsNameList = [
    {
      lang: 'en_apac',
      name: 'APAC (English)',
      home: `/en/apac.html`,
    },
    {
      lang: "ko",
      name: "Korea (한국어)",
      home: `/ko/ko.html`,
    },
    {
      lang: "en_uk",
      name: "UK (English)",
      home: `/en/uk.html`,
    },
    {
      lang: "en",
      name: "US (English)",
      home: `/`,
    }
  ];
  
  // Add Region Dropdown Container before Feds Footer
  const fedsFooter = document.querySelector('#feds-footer');
  if (fedsFooter) {
    const regionDropdownContainer = document.createElement('div');
    regionDropdownContainer.classList.add('region-dropdown');
    regionDropdownContainer.innerHTML = `<ul class="region-dropdown-list"></ul>`;
    fedsFooter.parentElement.insertBefore(regionDropdownContainer, fedsFooter);
  }
  
  // get actual selected Region
  const getSelectedRegion = () => {
    const regionPage = regionsNameList.find(r => r.home === location.pathname);
    // check if Region name matches the blog.language example 'en' in order to show the Region Name in the buttom
    const nonRegionPage = regionsNameList.find(r => r.lang === window.blog.language);
    let regionLang;
    let regionName;
    if (!regionPage) {
      // region array is empty, we are not on a region page -> check the sessionStorage, if no value, use blog.language
      regionLang = sessionStorage.getItem('blog-selected-language') || window.blog.language;
      // in order to show the Region name either from SessionStorage language or blog.language in our region button
      if (regionLang !== window.blog.language) {
        // if the selected Region lang do not match the blog.language we get the Region name based on the sessionStorage saved Language Value
        const storedLanguage = regionsNameList.find(r => r.lang === regionLang);
        regionName = storedLanguage.name;
      } else {
        // else we get the Region name base on the blog.language and after have find the same language in our RegionListName
        if (nonRegionPage !== undefined) {
            regionName = nonRegionPage.name;
        }       
      }
    } else {
      regionLang = regionPage.lang;
      regionName = regionPage.name;
      // sessionStorage will be used only if current Region lang is not same as blog.lang as en_apac or en_uk 
      // where blog.lang will still being en
      if (regionPage.lang !== window.blog.language) {
        sessionStorage.setItem('blog-selected-language', regionPage.lang);
      }
    } 
    return {regionLang, regionName};
  }

  const dropdownRegionList = document.querySelector('.region-dropdown-list');
  const {regionLang, regionName} = getSelectedRegion(); 

  // Change Region name value from Feds Region Picker Button adding the actual Region Name
  const FEDSregionPickerText = document.querySelector('.feds-regionPicker-text');
  if (FEDSregionPickerText && regionName !== undefined) {
      FEDSregionPickerText.innerText = regionName;
  }

  // Automatically build the dropdown based on Region List
  if (dropdownRegionList) {
    for (const {lang, name, home} of regionsNameList) {
      dropdownRegionList.insertAdjacentHTML('afterbegin', `<li><a class="region-dropdown-picker" href="${window.location.origin + home}" title="${name}" data-lang="${lang}">${name}</a></li>`);
      const regionDropdownPicker = document.querySelector('.region-dropdown-picker');
      if (regionDropdownPicker) {
        // Mark the actual selected Region on the dropdown
        if (regionLang === lang) {
          regionDropdownPicker.classList.add('selected');
        }
      }
    }
  }

  const regionDropdownButton =  document.querySelector('.feds-regionPicker');
  if (regionDropdownButton) {
    regionDropdownButton.addEventListener('click', (event) => {
      event.preventDefault();
      toggleDropdownModal();
    });
  }

  // Hide region modal if clicked outside
  document.addEventListener('click', function (event) {
    if (regionDropdownButton || HTMLElement) {
      if (!event.target.closest('.region-dropdown') && !event.target.closest('.feds-regionPicker')) {
        hideDropdownModal();
      }
    }
  });

  // Keyboard access for Region Picker
  if (regionDropdownButton) {
    document.body.addEventListener('keyup', (event) => {
      if (event.key === 'Escape') {
          toggleDropdownModal();
      }
    });
  }

  // As we are attaching the Dropdown on top of the Button region Picker
  // this position will be updated if the window change
  const regionDropdownModal  = document.querySelector('.region-dropdown');
  if (regionDropdownModal) {
    window.addEventListener('resize', () => {
          positionDropdownModal();
    });
  }
}

function positionDropdownModal() {
  const regionDropdownModal  = document.querySelector('.region-dropdown');
  const regionDropdownButton =  document.querySelector('.feds-regionPicker');
  if (regionDropdownModal) {
    regionDropdownModal.style.left = regionDropdownButton.getBoundingClientRect().left + window.scrollX + 'px';
    regionDropdownModal.style.top = (window.scrollY + regionDropdownButton.getBoundingClientRect().top) - 15 - regionDropdownModal.getBoundingClientRect().height + 'px';
  }
}

function showDropdownModal() {
  const regionDropdownModal  = document.querySelector('.region-dropdown');
  if (regionDropdownModal) {
    positionDropdownModal();
    regionDropdownModal.classList.add('visible');
  }
 }
 
 function hideDropdownModal() {
  const regionDropdownModal = document.querySelector('.region-dropdown');
  if (regionDropdownModal) {
      regionDropdownModal.classList.remove('visible');
  }
 }

function toggleDropdownModal() {
  const regionDropdownModal  = document.querySelector('.region-dropdown');
  if (regionDropdownModal) {
    if (regionDropdownModal.classList.contains('visible')) {
      hideDropdownModal();
    } else {
      showDropdownModal();
    }
  }
}

// Prep images for lazy loading and use adequate sizes
let imgCount = 0;
const observer = new MutationObserver(mutations => {
  mutations.forEach(mutation => {
    mutation.addedNodes.forEach(node => {
      // only handle images with src=/hlx_*
      if (node.tagName === 'IMG' && /\/hlx_/.test(node.src)) {
        const img = node;
        let width;
        if (window.blog.pageType === window.blog.TYPE.TOPIC) {
          // full width topic banner
          width = window.innerWidth <= 600 ? 600 :
            window.innerWidth <= 1200 ? 1200 : 2000;
        } else if (window.blog.pageType === window.blog.TYPE.AUTHOR) {
          // author pic
          width = window.innerWidth <= 1200 ? 124 : 224;
        } else {
          // post: hero vs body images
          width = window.innerWidth <= 600 ? 600 :
            imgCount > 0 ? 800 : 1000;
        }            
        width *= window.devicePixelRatio;
        const imgUrl = getOptimizedImageUrl(img.src, { width });
        if (imgCount === 0) {
          img.setAttribute('src', imgUrl);
        } else {
          // lazyload all but hero image
          img.setAttribute('data-src', imgUrl);
          img.removeAttribute('src');
          img.classList.add('lazyload');
        }
        imgCount++;
      }
    });
  });
});
observer.observe(document, { childList: true, subtree: true });

// Load page specific code
loadCSS(`/style/${window.blog.pageType}.css`);
loadJSModule(`/scripts/${window.blog.pageType}.js`);

// Load language specific CSS overlays
loadCSS(`/dict.${window.blog.language}.css`);

// Check if FEDS is available before loading the Dropdown Selector
if (typeof feds === 'object' && typeof feds.events === 'object' && feds.events.experience === true) {
  handleDropdownRegion();  
} else {
  window.addEventListener('feds.events.experience.loaded', handleDropdownRegion);
}

