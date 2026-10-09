import React, { useState, useEffect, useRef } from "react";
import { useHistory } from "react-router-dom";

import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import Select from "@material-ui/core/Select";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import { makeStyles } from "@material-ui/core";

import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import Autocomplete, {
  createFilterOptions
} from "@material-ui/lab/Autocomplete";
import CircularProgress from "@material-ui/core/CircularProgress";

import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import ButtonWithSpinner from "../ButtonWithSpinner";
import toastError from "../../errors/toastError";

const useStyles = makeStyles(theme => ({
  maxWidth: {
    width: "100%"
  }
}));

const filterOptions = createFilterOptions({
  trim: true
});

const TransferTicketModalCustom = ({
  modalOpen,
  onClose,
  ticketid,
  currentWhatsappId,
  currentCompanyId,
  hideUserSelection = false
}) => {
  const history = useHistory();
  const [options, setOptions] = useState([]);
  const [queues, setQueues] = useState([]);
  const [allQueues, setAllQueues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchParam, setSearchParam] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedQueue, setSelectedQueue] = useState("");
  const [selectedWhatsapp, setSelectedWhatsapp] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState(
    currentCompanyId || ""
  );
  const [targetCompanies, setTargetCompanies] = useState([]);
  const classes = useStyles();
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (hideUserSelection || !modalOpen) {
      setLoading(false);
      return;
    }
    const company = targetCompanies.find(
      item => item.id === Number(selectedCompanyId)
    );
    const search = searchParam.trim().toLowerCase();
    setOptions(
      (company?.users || []).filter(
        user =>
          !search ||
          user.name.toLowerCase().includes(search) ||
          user.email.toLowerCase().includes(search)
      )
    );
    setLoading(false);
  }, [
    searchParam,
    modalOpen,
    hideUserSelection,
    selectedCompanyId,
    targetCompanies
  ]);

  useEffect(() => {
    if (!modalOpen) return;
    const loadTransferTargets = async () => {
      try {
        const { data } = await api.get("/companies/transfer-targets");
        setTargetCompanies(data);
        setSelectedCompanyId(currentCompanyId || data[0]?.id || "");
      } catch (err) {
        toastError(err);
      }
    };
    loadTransferTargets();
  }, [modalOpen, currentCompanyId]);

  useEffect(() => {
    const company = targetCompanies.find(
      item => item.id === Number(selectedCompanyId)
    );
    setOptions(company?.users || []);
    setQueues(company?.queues || []);
    setAllQueues(company?.queues || []);
    setSelectedUser(null);
    setSelectedQueue("");
  }, [selectedCompanyId, targetCompanies]);

  useEffect(() => {
    const company = targetCompanies.find(
      item => item.id === Number(selectedCompanyId)
    );
    const connection = company?.whatsapps?.find(
      item => item.id === Number(selectedWhatsapp)
    );
    if (!selectedWhatsapp) {
      setAllQueues(company?.queues || []);
      setQueues(selectedUser?.queues || company?.queues || []);
      setSelectedQueue(currentQueue =>
        (selectedUser?.queues || company?.queues || []).some(
          queue => queue.id === Number(currentQueue)
        )
          ? currentQueue
          : ""
      );
      return;
    }
    const connectionQueues = connection?.queues || [];
    // When a destination connection is selected, its queues are the source
    // of truth. The selected user's queues must not hide queues configured for
    // that connection (for example, showing only "ATENDIMENTO").
    const availableQueues = connectionQueues;
    setAllQueues(availableQueues);
    setQueues(availableQueues);
    setSelectedQueue(currentQueue =>
      availableQueues.some(queue => queue.id === Number(currentQueue))
        ? currentQueue
        : ""
    );
  }, [selectedWhatsapp, selectedCompanyId, targetCompanies, selectedUser]);

  const handleClose = () => {
    onClose();
    setSearchParam("");
    setSelectedUser(null);
    setSelectedQueue("");
    setSelectedWhatsapp("");
    setSelectedCompanyId(currentCompanyId || "");
  };

  const handleSaveTicket = async e => {
    e.preventDefault();
    if (!ticketid) return;
    if (!selectedQueue && !selectedWhatsapp) return;
    setLoading(true);
    try {
      let data = {};

      if (selectedUser?.id) {
        data.userId = Number(selectedUser.id);
      }

      if (selectedQueue && selectedQueue !== null) {
        data.queueId = Number(selectedQueue);

        if (!selectedUser) {
          data.status = "pending";
          data.userId = null;
        }
      }

      if (selectedWhatsapp) {
        data.whatsappId = Number(selectedWhatsapp);
        data.targetCompanyId = Number(selectedCompanyId);
        data.status = selectedUser ? "open" : "pending";
        if (!selectedUser) data.userId = null;
      }

      await api.put(`/tickets/${ticketid}`, data);

      history.push(`/tickets`);
    } catch (err) {
      setLoading(false);
      toastError(err);
    }
  };

  return (
    <Dialog open={modalOpen} onClose={handleClose} maxWidth="lg" scroll="paper">
      <form onSubmit={handleSaveTicket}>
        <DialogTitle id="form-dialog-title">
          {i18n.t("transferTicketModal.title")}
        </DialogTitle>
        <DialogContent dividers>
          {!hideUserSelection && (
            <Autocomplete
              style={{ width: 300, marginBottom: 20 }}
              getOptionLabel={option => `${option.name}`}
              onChange={(e, newValue) => {
                const user =
                  newValue && typeof newValue === "object" && newValue.id
                    ? newValue
                    : null;
                setSelectedUser(user);
                if (user != null && Array.isArray(user.queues)) {
                  setQueues(user.queues);
                } else {
                  setQueues(allQueues);
                }
              }}
              options={options}
              filterOptions={filterOptions}
              autoHighlight
              isOptionEqualToValue={(option, value) => option.id === value.id}
              noOptionsText={i18n.t("transferTicketModal.noOptions")}
              loading={loading}
              renderInput={params => (
                <TextField
                  {...params}
                  label={i18n.t("transferTicketModal.fieldLabel")}
                  variant="outlined"
                  autoFocus
                  onChange={e => setSearchParam(e.target.value)}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <React.Fragment>
                        {loading ? (
                          <CircularProgress color="inherit" size={20} />
                        ) : null}
                        {params.InputProps.endAdornment}
                      </React.Fragment>
                    )
                  }}
                />
              )}
            />
          )}
          <FormControl
            variant="outlined"
            className={classes.maxWidth}
            style={{ marginBottom: 20 }}
          >
            <InputLabel>
              {i18n.t("transferTicketModal.fieldCompanyLabel")}
            </InputLabel>
            <Select
              value={selectedCompanyId}
              onChange={e => {
                setSelectedCompanyId(e.target.value);
                setSelectedWhatsapp("");
              }}
              label={i18n.t("transferTicketModal.fieldCompanyLabel")}
            >
              {targetCompanies.map(company => (
                <MenuItem key={company.id} value={company.id}>
                  {company.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl
            variant="outlined"
            className={classes.maxWidth}
            style={{ marginBottom: 20 }}
          >
            <InputLabel>
              {i18n.t("transferTicketModal.fieldWhatsappLabel")}
            </InputLabel>
            <Select
              value={selectedWhatsapp}
              onChange={e => setSelectedWhatsapp(e.target.value)}
              label={i18n.t("transferTicketModal.fieldWhatsappLabel")}
            >
              <MenuItem value="">
                {i18n.t("transferTicketModal.keepCurrentWhatsapp")}
              </MenuItem>
              {(
                targetCompanies.find(
                  company => company.id === Number(selectedCompanyId)
                )?.whatsapps || []
              )
                .filter(
                  whatsapp =>
                    !(
                      Number(selectedCompanyId) === Number(currentCompanyId) &&
                      whatsapp.id === currentWhatsappId
                    )
                )
                .map(whatsapp => (
                  <MenuItem key={whatsapp.id} value={whatsapp.id}>
                    {whatsapp.name} ({whatsapp.status})
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          <FormControl variant="outlined" className={classes.maxWidth}>
            <InputLabel>
              {i18n.t("transferTicketModal.fieldQueueLabel")}
            </InputLabel>
            <Select
              value={selectedQueue}
              onChange={e => setSelectedQueue(e.target.value)}
              label={i18n.t("transferTicketModal.fieldQueuePlaceholder")}
            >
              {queues.map(queue => (
                <MenuItem key={queue.id} value={queue.id}>
                  {queue.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleClose}
            color="secondary"
            disabled={loading}
            variant="outlined"
          >
            {i18n.t("transferTicketModal.buttons.cancel")}
          </Button>
          <ButtonWithSpinner
            variant="contained"
            type="submit"
            color="primary"
            loading={loading}
          >
            {i18n.t("transferTicketModal.buttons.ok")}
          </ButtonWithSpinner>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TransferTicketModalCustom;
