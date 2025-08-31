import {useState, useEffect, useContext} from "react";
import NavIcon from "../components/MainNav/NavIcon";
import { getArticlesProgressSummary } from "../utils/progressTracking/progressData";
import { APIContext } from "../contexts/APIContext";
import { ProgressContext } from "../contexts/ProgressContext";
import { calculateTotalReadingMinutes, getWeeklyTranslatedWordsCount, calculateWeeklyReadingMinutes, calculateConsecutivePracticeWeeks, selectTwoRandomItems } from "../utils/progressTracking/progressHelpers";
import * as s from "../components/progress_tracking/ProgressItems.sc";

export default function ArticlesProgressSummary() {
    const api = useContext(APIContext);
    const { weeklyReadingMinutes, setWeeklyReadingMinutes, weeklyTranslated, setWeeklyTranslated, weeksPracticed, setWeeksPracticed, totalTranslated, setTotalTranslated, totalReadingMinutes, setTotalReadingMinutes} = useContext(ProgressContext);
    const [randomItems, setRandomItems] = useState([]);

    useEffect(() => {
      const allValuesReady =
        weeklyReadingMinutes != null &&
        weeklyTranslated != null &&
        weeksPracticed != null &&
        totalTranslated != null &&
        totalReadingMinutes != null;
    
      if (allValuesReady) {
        const summary = getArticlesProgressSummary({
          weeklyTranslated,
          weeklyReadingMinutes,
          weeksPracticed,
          totalTranslated,
          totalReadingMinutes,
        }).articlesProgressSummary;
        const twoRandomItems = selectTwoRandomItems(summary);
        setRandomItems(twoRandomItems);
      }
    }, [
      weeklyReadingMinutes,
      weeklyTranslated,
      weeksPracticed,
      totalTranslated,
      totalReadingMinutes
    ]);

    useEffect(() =>{
        api.getBookmarksCountsByDate((counts) => {
          const totalTranslatedWords = counts.reduce((sum, day) => sum + day.count, 0);
          setTotalTranslated(totalTranslatedWords);
          const thisWeek = getWeeklyTranslatedWordsCount(counts);
          const weeklyTotal = thisWeek.reduce((sum, day) => sum + day.count, 0);
          setWeeklyTranslated(weeklyTotal);
        });

        api.getUserActivityByDay((activity) => {
          setTotalReadingMinutes(calculateTotalReadingMinutes(activity.reading));

          const readingMinsPerWeek = calculateWeeklyReadingMinutes(activity.reading);
          setWeeklyReadingMinutes(readingMinsPerWeek);

          const weeksPracticed = calculateConsecutivePracticeWeeks(activity);
          setWeeksPracticed(weeksPracticed);
    });
    }, []);

    return (
        <s.ProgressItemsContainer >
        {randomItems.map((item) => (
          <s.ProgressOverviewItem
            style={{ cursor: 'default', 
            pointerEvents: 'none' }}
          >
            <s.IconWithValueAndLabel>
              <s.IconAndValue>
                <s.Icon><NavIcon name={item.icon} size= '1.3em' /></s.Icon>
                <s.Value> {item.value} </s.Value>
              </s.IconAndValue>
              <s.Label>{item.iconText}</s.Label>
            </s.IconWithValueAndLabel>
            <s.ProgressDescription>
              {item.beforeText} {item.value} {item.afterText}
            </s.ProgressDescription>
          </s.ProgressOverviewItem>
      ))}       
        </s.ProgressItemsContainer>
    );
}