import React, { useState, useEffect, useContext } from "react";
import ArticlePreview from "./ArticlePreview";
import SortingButtons from "./SortingButtons";
import SearchField from "./SearchField";
import * as s from "./FindArticles.sc";
import LoadingAnimation from "../components/LoadingAnimation";

import LocalStorage from "../assorted/LocalStorage";

import ShowLinkRecommendationsIfNoArticles from "./ShowLinkRecommendationsIfNoArticles";
import { APIContext } from "../contexts/APIContext";
import useExtensionCommunication from "../hooks/useExtensionCommunication";
import useArticlePagination from "../hooks/useArticlePagination";
import UnfinishedArticlesList from "./UnfinishedArticleList";
import { setTitle } from "../assorted/setTitle";
import strings from "../i18n/definitions";
import useShadowRef from "../hooks/useShadowRef";
import { Link } from "react-router-dom";
import VideoPreview from "../videos/VideoPreview";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";

export default function FindArticles({ content, searchQuery, searchPublishPriority, searchDifficultyPriority }) {
  let api = useContext(APIContext);

  //The ternary operator below fix the problem with the getOpenArticleExternallyWithoutModal()
  //getter that was outputting undefined string values when they should be false.
  //This occurs before the user selects their own preferences.
  //Additionally, the conditional statement needed to be tightened up due to JS's unstable behavior, which resulted
  //in bool values changing on its own on refresh without any other external trigger or preferences change.
  // A '=== "true"' clause has been added to the getters to achieve predictable and desired bool values.
  const doNotShowRedirectionModal_LocalStorage = LocalStorage.getDoNotShowRedirectionModal() === "true";
  const [articlesAndVideosList, setArticlesAndVideosList] = useState();
  const [originalList, setOriginalList] = useState(null);
  const [searchError, setSearchError] = useState(false);

  const [isExtensionAvailable] = useExtensionCommunication();
  const [doNotShowRedirectionModal_UserPreference, setDoNotShowRedirectionModal_UserPreference] = useState(
    doNotShowRedirectionModal_LocalStorage,
  );
  const [reloadingSearchArticles, setReloadingSearchArticles] = useState(false);

  const searchPublishPriorityRef = useShadowRef(searchPublishPriority);
  const searchDifficultyPriorityRef = useShadowRef(searchDifficultyPriority);

  // Next three vars required for the "Show Videos Only" toggle button
  const [areVideosAvailable, setAreVideosAvailable] = useState(false);
  const [isShowVideosOnlyEnabled, setIsShowVideosOnlyEnabled] = useState(false);
  // Ref is needed since it's called in the updateOnPagination function. This function
  // could have stale values if using the state constant.
  const isShowVideosOnlyEnabledRef = useShadowRef(isShowVideosOnlyEnabled);

  function getNewArticlesForPage(pageNumber, handleArticleInsertion) {
    if (searchQuery) {
      api.searchMore(
        searchQuery,
        pageNumber,
        searchPublishPriorityRef.current,
        searchDifficultyPriorityRef.current,
        handleArticleInsertion,
        (error) => {
        },
      );
    } else {
      api.getMoreUserArticles(20, pageNumber, handleArticleInsertion);
    }
  }

  function updateOnPagination(newUpdatedList) {
    if (isShowVideosOnlyEnabledRef.current) {
      const videosOnly = [...newUpdatedList].filter((each) => each.video);
      setArticlesAndVideosList(videosOnly);
    } else {
      setArticlesAndVideosList(newUpdatedList);
      setOriginalList(newUpdatedList);
    }
  }

  const [handleScroll, isWaitingForNewArticles, noMoreArticlesToShow, resetPagination] = useArticlePagination(
    articlesAndVideosList,
    updateOnPagination,
    searchQuery ? "Article Search" : strings.titleHome,
    getNewArticlesForPage,
  );

  function handleVideoOnlyClick() {
    setIsShowVideosOnlyEnabled(!isShowVideosOnlyEnabled);
    if (isShowVideosOnlyEnabled) {
      setArticlesAndVideosList(originalList);
      resetPagination();
    } else {
      const videosOnly = [...articlesAndVideosList].filter((each) => each.video);
      setArticlesAndVideosList(videosOnly);
    }
  }

  const handleArticleClick = (articleId, sourceId, index) => {
    const seenList = articlesAndVideosList.slice(0, index).map((each) => each.source_id);
    const seenListAsString = JSON.stringify(seenList, null, 0);
    api.logUserActivity(api.CLICKED_ARTICLE, articleId, "", seenListAsString, sourceId);
  };

  const handleVideoClick = (sourceId, index) => {
    const seenList = articlesAndVideosList.slice(0, index).map((each) => each.source_id);
    const seenListAsString = JSON.stringify(seenList, null, 0);
    api.logUserActivity(api.CLICKED_VIDEO, null, "", seenListAsString, sourceId);
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      window.removeEventListener("scroll", handleScroll, true);
    };
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    LocalStorage.setDoNotShowRedirectionModal(doNotShowRedirectionModal_UserPreference);
  }, [doNotShowRedirectionModal_UserPreference]);

  useEffect(() => {
    resetPagination();
    setSearchError(false);
    if (searchQuery) {
      setTitle(strings.titleSearch + ` '${searchQuery}'`);
      setReloadingSearchArticles(true);
      api.search(
        searchQuery,
        searchPublishPriority,
        searchDifficultyPriority,
        (articles) => {
          setArticlesAndVideosList(articles);
          setOriginalList([...articles]);
          setReloadingSearchArticles(false);
          articles.some((e) => e.video) ? setAreVideosAvailable(true) : setAreVideosAvailable(false);
        },
        (error) => {
          setArticlesAndVideosList([]);
          setOriginalList([]);
          setReloadingSearchArticles(false);
          setSearchError(true);
        },
      );
    } else {
      setTitle(strings.titleHome);
      api.getUserArticles((articles) => {
        setArticlesAndVideosList(articles);
        setOriginalList([...articles]);
        articles.some((e) => e.video) ? setAreVideosAvailable(true) : setAreVideosAvailable(false);
      });
      window.addEventListener("scroll", handleScroll, true);
      return () => {
        window.removeEventListener("scroll", handleScroll, true);
      };
    }
    // eslint-disable-next-line
  }, [searchPublishPriority, searchDifficultyPriority]);

  if (articlesAndVideosList == null) {
    return <LoadingAnimation />;
  }

  if (searchError) {
    return (
      <>
        <s.SearchHolder>
          <SearchField query={searchQuery} />
        </s.SearchHolder>

        <b>An error occurred with this query. Please try a different keyword.</b>
      </>
    );
  }

  return (
    <>
      {!searchQuery && (
        <>
          <UnfinishedArticlesList articleList={articlesAndVideosList} setArticleList={setArticlesAndVideosList} />
          <s.SortHolder style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            marginTop: window.innerWidth <= 768 ? "0" : "1.5rem",
            marginBottom: window.innerWidth <= 768 ? "0.5rem" : "1.5rem"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <SettingsRoundedIcon style={{ fontSize: "1.2em", cursor: "pointer" }} title="Customize this page by subscribing to topics, filtering keywords, or adding searches" />
              <span style={{ fontSize: window.innerWidth <= 768 ? "0.8em" : "0.9em", color: "#666", whiteSpace: "nowrap" }}>
                <Link className="bold underlined-link" to="/account_settings/interests?fromArticles=1">
                  Topics
                </Link>
                {" • "}
                <Link className="bold underlined-link" to="/account_settings/excluded_keywords?fromArticles=1">
                  Keywords
                </Link>
                {" • "}
                <Link className="bold underlined-link" to="/articles/mySearches">
                  Saved Searches
                </Link>
              </span>
            </div>
            <s.ShowVideoOnlyButton
              className={isShowVideosOnlyEnabled && "selected"}
              style={{ visibility: !areVideosAvailable && "hidden" }}
              onClick={handleVideoOnlyClick}
            >
              Show videos only
            </s.ShowVideoOnlyButton>
          </s.SortHolder>
        </>
      )}

      {searchQuery && (
        <s.SearchHolder>
          <SearchField query={searchQuery} />
        </s.SearchHolder>
      )}

      {/* This is where the content of the Search component will be rendered */}
      {content}
      {reloadingSearchArticles && <LoadingAnimation></LoadingAnimation>}
      {!reloadingSearchArticles &&
        articlesAndVideosList.map((each, index) =>
          each.video ? (
            <VideoPreview key={each.id} video={each} notifyVideoClick={() => handleVideoClick(each.source_id, index)} />
          ) : (
            <ArticlePreview
              key={each.id}
              article={each}
              hasExtension={isExtensionAvailable}
              doNotShowRedirectionModal_UserPreference={doNotShowRedirectionModal_UserPreference}
              setDoNotShowRedirectionModal_UserPreference={setDoNotShowRedirectionModal_UserPreference}
              notifyArticleClick={() => handleArticleClick(each.id, each.source_id, index)}
            />
          ),
        )}
      {!reloadingSearchArticles && articlesAndVideosList.length === 0 && (
        <div style={{ textAlign: "center", marginTop: "1rem" }}>
          <p>No results were found for this query.</p>
        </div>
      )}

      {!searchQuery && (
        <>
          <ShowLinkRecommendationsIfNoArticles
            articleList={articlesAndVideosList}
          ></ShowLinkRecommendationsIfNoArticles>
        </>
      )}
      {isWaitingForNewArticles && <LoadingAnimation delay={0}></LoadingAnimation>}
      {noMoreArticlesToShow && articlesAndVideosList.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-around",
            margin: "2em 0px",
          }}
        >
          There are no more results.
        </div>
      )}
    </>
  );
}
