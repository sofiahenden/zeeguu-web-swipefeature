import React from "react";
import {
  Bar,
  DismissButton,
  OpenButton,
  SaveButton,
  ButtonInner,
  ReadWrapper,
  ReadLabel,
  IconStyles,
} from "./ArticleSwipeControl.sc.js";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import FavoriteBorderRoundedIcon from "@mui/icons-material/FavoriteBorderRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";

export default function ArticleSwipeControl({
  onDismiss = () => {},
  onOpen = () => {},
  onSave = () => {},
  children,
  isSaved = false,
}) {
  return (
  <IconStyles>
    <Bar>
      <DismissButton onClick={onDismiss} aria-label="Dismiss">
        <ButtonInner>
          <CloseRoundedIcon className="icon-large" />
        </ButtonInner>
      </DismissButton>

      <OpenButton onClick={onOpen} aria-label="Open Article">
        <ButtonInner>
          <ReadWrapper>
            <MenuBookRoundedIcon className="icon-medium" />
            <ReadLabel>Read</ReadLabel>
          </ReadWrapper>
        </ButtonInner>
      </OpenButton>

      {children ? (
        <SaveButton as="div" aria-label="Save Article">
          <ButtonInner>{children}</ButtonInner>
        </SaveButton>
      ) : (
        <SaveButton
          onClick={onSave}
          aria-label="Save Article"
          className={isSaved ? "saved" : ""}
        >
          <ButtonInner>
            <FavoriteBorderRoundedIcon className="heart-outline icon-medium" />
            <FavoriteRoundedIcon className="heart-filled icon-medium" />
          </ButtonInner>
        </SaveButton>
      )}
    </Bar>
  </IconStyles>
);
}
