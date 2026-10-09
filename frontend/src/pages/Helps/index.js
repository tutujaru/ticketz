import React, { useState, useEffect } from "react";

import { makeStyles, Paper, Box, Typography, Chip } from "@material-ui/core";

import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import Title from "../../components/Title";
import { i18n } from "../../translate/i18n";
import useHelps from "../../hooks/useHelps";

import Accordion from "@material-ui/core/Accordion";
import AccordionSummary from "@material-ui/core/AccordionSummary";
import AccordionDetails from "@material-ui/core/AccordionDetails";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import HelpOutlineIcon from "@material-ui/icons/HelpOutline";
import PlayCircleOutlineOutlinedIcon from "@material-ui/icons/PlayCircleOutlineOutlined";

const useStyles = makeStyles(theme => ({
  container: {
    paddingBottom: theme.spacing(2)
  },
  mainPaper: {
    width: "100%",
    minHeight: "300px",
    borderRadius: "16px",
    backgroundColor: "#ffffff",
    boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.04)",
    border: "1px solid #f1f5f9",
    padding: theme.spacing(3),
    overflowY: "auto",
    ...theme.scrollbarStyles
  },
  // Accordion moderno
  accordion: {
    borderRadius: "12px !important",
    border: "1px solid #f1f5f9",
    boxShadow: "none !important",
    backgroundColor: "#ffffff",
    marginBottom: theme.spacing(1.5),
    overflow: "hidden",
    transition: "all 0.2s ease",
    "&:before": {
      display: "none"
    },
    "&:hover": {
      borderColor: "#cbd5e1",
      boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.04) !important"
    },
    "&.Mui-expanded": {
      margin: `${theme.spacing(1.5)}px 0`,
      borderColor: "#3b82f6",
      boxShadow: "0px 4px 16px rgba(59, 130, 246, 0.08) !important"
    }
  },
  // Cabeçalho do accordion
  accordionSummary: {
    padding: theme.spacing(1.5, 2),
    minHeight: "64px",
    "&.Mui-expanded": {
      minHeight: "64px"
    },
    "& .MuiAccordionSummary-content": {
      margin: "12px 0",
      alignItems: "center",
      gap: theme.spacing(2),
      "&.Mui-expanded": {
        margin: "12px 0"
      }
    }
  },
  // Badge com ícone de play
  playBadge: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    backgroundColor: "#eff6ff",
    color: "#3b82f6",
    flexShrink: 0,
    "& svg": {
      fontSize: "1.4rem"
    }
  },
  // Wrapper do título/descrição
  summaryContent: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    gap: theme.spacing(0.5),
    minWidth: 0
  },
  // Título
  heading: {
    fontSize: "0.95rem",
    fontWeight: 700,
    color: "#0f172a",
    lineHeight: 1.3
  },
  // Descrição
  secondaryHeading: {
    fontSize: "0.8rem",
    color: "#64748b",
    lineHeight: 1.4
  },
  // Ícone de expandir
  expandIcon: {
    color: "#64748b",
    transition: "transform 0.2s ease",
    "&.Mui-expanded": {
      color: "#3b82f6"
    }
  },
  // Área do conteúdo (vídeo)
  accordionDetails: {
    padding: theme.spacing(0, 2, 2, 2),
    display: "block"
  },
  // Container do vídeo responsivo
  videoContainer: {
    position: "relative",
    width: "100%",
    maxWidth: "860px",
    margin: "0 auto",
    paddingBottom: "56.25%", // aspect ratio 16:9
    height: 0,
    borderRadius: "12px",
    overflow: "hidden",
    backgroundColor: "#000000",
    boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.15)"
  },
  iframe: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    border: 0,
    borderRadius: "12px"
  },
  // Chip do ID do vídeo
  videoChip: {
    backgroundColor: "#f3e8ff",
    color: "#6b21a8",
    fontWeight: 600,
    fontSize: "0.65rem",
    height: "20px",
    borderRadius: "6px",
    fontFamily: "monospace",
    marginLeft: theme.spacing(1)
  },
  // Empty state
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing(8, 2),
    textAlign: "center"
  },
  emptyStateIcon: {
    fontSize: "4rem",
    color: "#cbd5e1",
    marginBottom: theme.spacing(2)
  },
  emptyStateText: {
    color: "#64748b",
    fontWeight: 500
  }
}));

const Helps = () => {
  const classes = useStyles();

  const [records, setRecords] = useState([]);
  const { list } = useHelps();

  useEffect(() => {
    async function fetchData() {
      const helps = await list();
      setRecords(helps);
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderVideo = record => {
    const url = `https://www.youtube.com/embed/${record.video}`;
    return (
      <div className={classes.videoContainer}>
        <iframe
          className={classes.iframe}
          src={url}
          title={`YouTube video: ${record.title}`}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    );
  };

  const renderEmptyState = () => (
    <div className={classes.emptyState}>
      <HelpOutlineIcon className={classes.emptyStateIcon} />
      <Typography variant="h6" className={classes.emptyStateText}>
        Nenhum tutorial disponível ainda
      </Typography>
      <Typography
        variant="body2"
        style={{ color: "#94a3b8", marginTop: 8 }}
      >
        Novos vídeos e tutoriais aparecerão aqui quando forem adicionados.
      </Typography>
    </div>
  );

  const renderHelps = () => {
    if (!records.length) {
      return renderEmptyState();
    }

    return (
      <>
        {records.map((record, key) => (
          <Accordion key={key} className={classes.accordion} elevation={0}>
            <AccordionSummary
              className={classes.accordionSummary}
              expandIcon={
                <ExpandMoreIcon className={classes.expandIcon} />
              }
              aria-controls={`panel-${key}-content`}
              id={`panel-${key}-header`}
            >
              <div className={classes.playBadge}>
                <PlayCircleOutlineOutlinedIcon />
              </div>
              <div className={classes.summaryContent}>
                <Typography className={classes.heading}>
                  {record.title}
                </Typography>
                <Typography className={classes.secondaryHeading}>
                  {record.description}
                </Typography>
              </div>
            </AccordionSummary>
            <AccordionDetails className={classes.accordionDetails}>
              {renderVideo(record)}
            </AccordionDetails>
          </Accordion>
        ))}
      </>
    );
  };

  return (
    <MainContainer className={classes.container}>
      <MainHeader>
        <Title>{i18n.t("helps.title")}</Title>
        <MainHeaderButtonsWrapper></MainHeaderButtonsWrapper>
      </MainHeader>
      <Paper className={classes.mainPaper} elevation={0}>
        {renderHelps()}
      </Paper>
    </MainContainer>
  );
};

export default Helps;
