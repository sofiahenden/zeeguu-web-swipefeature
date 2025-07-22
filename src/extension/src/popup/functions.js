import { Article, ArticleAsync } from "../InjectedReaderApp/Article";
import { BROWSER_API } from "../utils/browserApi";

export async function getCurrentTab() {
  const queryOptions = { active: true, currentWindow: true };
  const [tab] = await BROWSER_API.tabs.query(queryOptions);
  return tab;
}

export function setCurrentURL(tabURL) {
  BROWSER_API.storage.local.set({ tabURL: tabURL });
}

export async function getCurrentURL() {
  const value = await BROWSER_API.storage.local.get("tabURL");
  return value.tabURL;
}

export async function getNativeLanguage() {
  const value = await BROWSER_API.storage.local.get("userInfo");
  return value.userInfo.native_language;
}

export async function getUsername() {
  const value = await BROWSER_API.storage.local.get("userInfo");
  return value.userInfo.name;
}

export async function getSessionId() {
  const value = await BROWSER_API.storage.local.get("sessionId");
  return value.sessionId;
}

export function getSourceAsDOM(url) {
  try {
    const xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET", url, false);
    // Don't set timeout for sync requests - it's not supported
    xmlhttp.send();
    
    if (xmlhttp.status !== 200) {
      throw new Error(`HTTP ${xmlhttp.status}: ${xmlhttp.statusText}`);
    }
    
    const parser = new DOMParser();
    //const clean = DOMPurify.sanitize(xmlhttp.responseText);
    return parser.parseFromString(xmlhttp.responseText, "text/html");
  } catch (error) {
    console.error("Failed to fetch article content:", error);
    throw error;
  }
}

export async function getSourceAsDOMAsync(url) {
  return new Promise((resolve, reject) => {
    const xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET", url, true); // Async request
    xmlhttp.timeout = 15000; // Set 15 second timeout
    
    xmlhttp.onload = function() {
      if (xmlhttp.status === 200) {
        const parser = new DOMParser();
        //const clean = DOMPurify.sanitize(xmlhttp.responseText);
        resolve(parser.parseFromString(xmlhttp.responseText, "text/html"));
      } else {
        reject(new Error(`HTTP ${xmlhttp.status}: ${xmlhttp.statusText}`));
      }
    };
    
    xmlhttp.onerror = function() {
      reject(new Error('Network error occurred'));
    };
    
    xmlhttp.ontimeout = function() {
      reject(new Error('Request timed out'));
    };
    
    try {
      xmlhttp.send();
    } catch (error) {
      reject(error);
    }
  });
}

export function removeAllChildNodes(parent) {
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }
}

export function deleteCurrentDOM() {
  const body = document.querySelector("body");
  if (body) {
    removeAllChildNodes(body);
  }
  const head = document.querySelector("head");
  if (head) {
    // Only preserve styled-components style tags (they have data-styled attribute)
    // These are our extension's styles, not the page's original styles
    const styledComponentsStyles = head.querySelectorAll('style[data-styled]');
    removeAllChildNodes(head);
    // Re-add only our styled-components styles
    styledComponentsStyles.forEach(style => head.appendChild(style));
  }
  const div = document.querySelector("div");
  if (div) {
    removeAllChildNodes(div);
  }
  const iframe = document.querySelector("iframe");
  if (iframe) {
    removeAllChildNodes(iframe);
  }
}

export function deleteTimeouts() {
  var id = window.setTimeout(function () {}, 0);
  while (id--) {
    window.clearTimeout(id);
  }
}

export function deleteEvents() {
  // https://stackoverflow.com/a/39026635
  document.body.outerHTML = document.body.outerHTML;
}

export function deleteIntervals() {
  var id = window.setInterval(function () {}, 0);
  while (id--) {
    window.clearInterval(id);
  }
}

export function checkLanguageSupport(api, tab, setLanguageSupported, setArticleData, setLoadingProgress, setFragmentData) {
  if (setLoadingProgress) setLoadingProgress("Fetching article content...");
  
  ArticleAsync(tab.url).then((article) => {
    if (setArticleData) setArticleData(article);
    if (setLoadingProgress) setLoadingProgress("Checking language support...");
    
    api.isArticleLanguageSupported(article.textContent, (result_dict) => {
      if (result_dict === "NO") {
        setLanguageSupported(false);
      }
      if (result_dict === "YES") {
        if (setLoadingProgress) setLoadingProgress("Processing article fragments...");
        
        // Get tokenized fragments
        let info = { url: tab.url };
        api.findOrCreateArticle(info, (articleResult) => {
          if (articleResult.includes("Language not supported")) {
            setLanguageSupported(false);
            return;
          }
          
          try {
            let artinfo = JSON.parse(articleResult);
            if (setFragmentData) {
              setFragmentData(artinfo);
            }
            if (setLoadingProgress) setLoadingProgress("Preparing reader...");
            setLanguageSupported(true);
          } catch (error) {
            console.error("Failed to parse article info:", error);
            setLanguageSupported(false);
          }
        });
      }
    });
  }).catch((error) => {
    console.error("Failed to fetch article for language check:", error);
    setLanguageSupported(false);
  });
}

export function checkLanguageSupportFromUrl(api, url, setLanguageSupported) {
  Article(url).then((article) => {
    api.isArticleLanguageSupported(article.textContent, (result_dict) => {
      // console.log(result_dict);
      if (result_dict === "NO") {
        setLanguageSupported(false);
      }
      if (result_dict === "YES") {
        setLanguageSupported(true);
      }
    });
  });
}

export function setUserInLocalStorage(user, api) {
  if (user !== undefined) {
    BROWSER_API.storage.local.set({ userInfo: user });
    BROWSER_API.storage.local.set({ sessionId: user.session });
    api.session = user.session;
  }
}
