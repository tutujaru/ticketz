import React, { useState, useEffect, useRef } from "react";
import { useHistory } from "react-router-dom";

import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import Select from "@material-ui/core/Select";
import FormControl from "@material-ui/core/FormControl";
import FormHelperText from "@material-ui/core/FormHelperText";
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
import useQueues from "../../hooks/useQueues";

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
  const [loadingQueues, setLoadingQueues] = useState(false);
  const [searchParam, setSearchParam] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedQueue, setSelectedQueue] = useState("");
  const [selectedWhatsapp, setSelectedWhatsapp] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState(
    currentCompanyId || ""
  );
  const [targetCompanies, setTargetCompanies] = useState([]);
  const classes = useStyles();
  const { findAll: findAllQueues } = useQueues();
  const isMounted = useRef(true);

  // The ticket will be moved to another company, so the users, queues and
  // connections must be the ones of the selected company.
  const changingCompany =
    Number(selectedCompanyId) !== Number(currentCompanyId);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Users of the selected company
  useEffect(() => {
    if (
      hideUserSelection ||
      !modalOpen ||
      !selectedCompanyId ||
      searchParam.length < 3
    ) {
      setLoading(false);
      return;
    }
    const delayDebounceFn = setTimeout(() => {
      setLoading(true);
      const fetchUsers = async () => {
        try {
          const { data } = await api.get("/users/", {
            params: { searchParam, companyId: selectedCompanyId }
          });
          if (!isMounted.current) return;
          setOptions(data.users);
          setLoading(false);
        } catch (err) {
          setLoading(false);
          toastError(err);
        }
      };

      fetchUsers();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchParam, modalOpen, hideUserSelection, selectedCompanyId]);

  // Queues of the selected company
  useEffect(() => {
    if (!modalOpen || !selectedCompanyId) return;
    const loadQueues = async () => {
      setLoadingQueues(true);
      try {
        const list = await findAllQueues(selectedCompanyId);
        if (!isMounted.current) return;
        setAllQueues(list);
        setQueues(list);
      } catch (err) {
        if (isMounted.current) toastError(err);
      } finally {
        if (isMounted.current) setLoadingQueues(false);
      }
    };
    loadQueues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalOpen, selectedCompanyId]);

  useEffect(() => {
    if (!modalOpen) return;
    const loadTransferTargets = async () => {
      try {
        const { data } = await api.get("/companies/transfer-targets");
        if (!isMounted.current) return;
        setTargetCompanies(data);
        setSelectedCompanyId(currentCompanyId || data[0]?.id || "");
      } catch (err) {
        toastError(err);
      }
    };
    loadTransferTargets();
  }, [modalOpen, currentCompanyId]);

  const handleClose = () => {
    onClose();
    setSearchParam("");
    setSelectedUser(null);
    setSelectedQueue("");
    setSelectedWhatsapp("");
    setSelectedCompanyId(currentCompanyId || "");
    setOptions([]);
    setQueues([]);
    setAllQueues([]);
  };

  const handleCompanyChange = e => {
    setSelectedCompanyId(e.target.value);
    setSelectedWhatsapp("");
    setSelectedQueue("");
    setSelectedUser(null);
    setSearchParam("");
    setOptions([]);
  };

  const handleUserChange = (e, newValue) => {
    setSelectedUser(newValue);
    setSelectedQueue("");
    if (newValue != null && Array.isArray(newValue.queues)) {
      const userQueues = newValue.queues.filter(queue =>
        allQueues.some(companyQueue => companyQueue.id === queue.id)
      );
      setQueues(userQueues.length > 0 ? userQueues : allQueues);
    } else {
      setQueues(allQueues);
    }
  };

  const handleSaveTicket = async e => {
    e.preventDefault();
    if (!ticketid) return;
    if (!selectedQueue && !selectedWhatsapp) return;
    if (changingCompany && !selectedWhatsapp) return;
    setLoading(true);
    try {
      let data = {};

      if (selectedUser) {
        data.userId = selectedUser.id;
      }

      if (selectedQueue && selectedQueue !== null) {
        data.queueId = selectedQueue;

        if (!selectedUser) {
          data.status = "pending";
          data.userId = null;
        }
      }

      if (selectedWhatsapp) {
        data.whatsappId = Number(selectedWhatsapp);
        data.targetCompanyId = Number(selectedCompanyId);
        data.status = "pending";
        if (!selectedUser) {
          data.userId = null;
        }
      } else if (changingCompany) {
        data.targetCompanyId = Number(selectedCompanyId);
      }

      await api.put(`/tickets/${ticketid}`, data);

      history.push(`/tickets`);
    } catch (err) {
      setLoading(false);
      toastError(err);
    }
  };

  const targetCompany = targetCompanies.find(
    company => company.id === Number(selectedCompanyId)
  );
  const targetWhatsapps = (targetCompany?.whatsapps || []).filter(
    whatsapp =>
      !(
        Number(selectedCompanyId) === Number(currentCompanyId) &&
        whatsapp.id === currentWhatsappId
      )
  );

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
              onChange={handleUserChange}
              options={options}
              filterOptions={filterOptions}
              freeSolo
              autoHighlight
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
              onChange={handleCompanyChange}
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
              {!changingCompany && (
                <MenuItem value="">
                  {i18n.t("transferTicketModal.keepCurrentWhatsapp")}
                </MenuItem>
              )}
              {targetWhatsapps.map(whatsapp => (
                <MenuItem key={whatsapp.id} value={whatsapp.id}>
                  {whatsapp.name} ({whatsapp.status})
                </MenuItem>
              ))}
            </Select>
            {changingCompany && !selectedWhatsapp && (
              <FormHelperText>
                {i18n.t("transferTicketModal.fieldWhatsappRequired")}
              </FormHelperText>
            )}
          </FormControl>
          <FormControl variant="outlined" className={classes.maxWidth}>
            <InputLabel>
              {i18n.t("transferTicketModal.fieldQueueLabel")}
            </InputLabel>
            <Select
              value={selectedQueue}
              onChange={e => setSelectedQueue(e.target.value)}
              label={i18n.t("transferTicketModal.fieldQueueLabel")}
              disabled={loadingQueues}
            >
              {!loadingQueues && queues.length === 0 && (
                <MenuItem value="" disabled>
                  {i18n.t("transferTicketModal.noQueues")}
                </MenuItem>
              )}
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
            disabled={loading || (changingCompany && !selectedWhatsapp)}
          >
            {i18n.t("transferTicketModal.buttons.ok")}
          </ButtonWithSpinner>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TransferTicketModalCustom;
