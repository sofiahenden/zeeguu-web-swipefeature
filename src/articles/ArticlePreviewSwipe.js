import React, { useState } from "react";
import * as s from "./ArticlePreviewSwipe.cs.js";
import {estimateReadingTime} from "../utils/misc/readableTime";
import {getStaticPath} from "../utils/misc/staticPath";
import {TranslatableText} from "../reader/TranslatableText";
import { motion, AnimatePresence, useMotionValue } from "framer-motion";

export default function ArticlePreviewSwipe({ article, interactiveSummary, interactiveTitle, onSwipeLeft, onSwipeRight, }) {

    const [isRemoved, setIsRemoved] = useState(false);
    const [swipingOut, setSwipingOut] = useState(false);
    const [swipeDirection, setSwipeDirection] = useState(null);

    const x = useMotionValue(0);
    const threshold = 120;

    const handleDragEnd = (_, info) => {
        if (info.offset.x > threshold) {
            setSwipeDirection("right");
            setSwipingOut(true);
        } else if (info.offset.x < -threshold) {
            setSwipeDirection("left");
            setSwipingOut(true);
        } else {
            x.set(0);
        }
    };

    const handleAnimationComplete = () => {
        if (swipeDirection) {
            let shouldRemove = false;
            if (swipeDirection === "left") shouldRemove = onSwipeLeft?.(article) ?? true;
            if (swipeDirection === "right") onSwipeRight?.(article);
            if (shouldRemove) {
                setIsRemoved(true);
            } else {
                setSwipeDirection(null);
                setSwipingOut(false);
                x.set(0);
            }
        }
    };


    return (
        <AnimatePresence>
            {!isRemoved && (
                <motion.div
                    key={article.id}
                    drag={!swipingOut ? "x" : false}
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.2}
                    style={{ x, touchAction: "pan-y", cursor: "grab" }}
                    onDragEnd={handleDragEnd}
                    animate={
                        swipingOut
                            ? {
                                x: swipeDirection === "right" ? 1000 : -1000,
                                opacity: 0,
                                transition: { duration: 0.4, ease: "easeOut" },
                            }
                            : {}
                    }
                    onAnimationComplete={handleAnimationComplete}
                    whileTap={{ scale: 1.05 }}
                >
                    <s.CardContainer>
                        <s.ImageWrapper>
                            {article.img_url && <img alt="" src={article.img_url} />}
                            <s.ReadTimeWrapper>
                                <img src={getStaticPath("icons", "read-time-icon.png")} alt="read time icon"/>
                                {estimateReadingTime(article.metrics?.word_count || article.word_count || 0)}
                            </s.ReadTimeWrapper>
                        </s.ImageWrapper>

                        <s.Content>

                            <s.Title>{interactiveTitle ? (
                                <TranslatableText interactiveText={interactiveTitle} translating={true} pronouncing={true} />
                            ) : (
                                article.title
                            )}</s.Title>
                            <s.Summary><span style={{ flex: "1", minWidth: "fit-content" }}>
                            {interactiveSummary ? (
                                <TranslatableText interactiveText={interactiveSummary} translating={true} pronouncing={true} />
                            ) : (
                                article.summary
                            )}
                          </span></s.Summary>
                            {/* <s.ContinueReading>
                                {titleLink(article)}
                            </s.ContinueReading> */}
                        </s.Content>

                        {/* <s.Footer>
                            from{" "}
                            {article.feed_id ? (
                                    <span>{article.feed_name || article.feed_icon_name?.replace(/\.[^.]+$/, "") }</span>
                            ) : (
                                article.url && <span>{extractDomain(article.url)}</span>
                            )}
                        </s.Footer> */}
                    </s.CardContainer>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
