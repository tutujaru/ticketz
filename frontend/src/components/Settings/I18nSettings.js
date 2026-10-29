import React, { useState, useEffect, useCallback } from "react";
import {
  Grid,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton
} from "@material-ui/core";
import { Edit, Save, Delete } from "@material-ui/icons";
import { toast } from "react-toastify";
import api from "../../services/api";
import { SelectLanguage } from "../SelectLanguage";

const I18nSettings = () => {
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [translations, setTranslations] = useState([]);
  const [editingKey, setEditingKey] = useState(null);
  const [editingValue, setEditingValue] = useState("");
  const [newRow, setNewRow] = useState(null);

  const fetchTranslations = useCallback(async () => {
    try {
      const { data } = await api.get("/translations", {
        params: { namespace: "backend", language: selectedLanguage }
      });
      setTranslations(data.translations);
    } catch (error) {
      toast.error("Error fetching translations");
    }
  }, [selectedLanguage]);

  useEffect(() => {
    if (selectedLanguage) {
      fetchTranslations();
    }
  }, [selectedLanguage, fetchTranslations]);

  const handleSaveTranslation = async (key, value) => {
    if (!key) return;

    try {
      await api.post("/translations", {
        namespace: "backend",
        language: selectedLanguage,
        key,
        value
      });
      fetchTranslations();
      setEditingKey(null);
      setEditingValue("");
      setNewRow(null);
      toast.success("Translation saved successfully");
    } catch (error) {
      toast.error("Error saving translation");
    }
  };

  const handleDeleteTranslation = async key => {
    await handleSaveTranslation(key, "");
  };

  return (
    <div>
      <Grid container spacing={3}>
        <Grid item xs={3}>
          <SelectLanguage
            value={selectedLanguage}
            onChange={e => setSelectedLanguage(e.target.value)}
            fullWidth
            variant="outlined"
          />
        </Grid>
      </Grid>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Key</TableCell>
            <TableCell>Value</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {newRow && (
            <TableRow>
              <TableCell>
                <TextField
                  value={newRow.key}
                  onChange={e =>
                    setNewRow(prev => ({ ...prev, key: e.target.value }))
                  }
                  fullWidth
                />
              </TableCell>
              <TableCell>
                <TextField
                  value={newRow.value}
                  onChange={e =>
                    setNewRow(prev => ({ ...prev, value: e.target.value }))
                  }
                  fullWidth
                />
              </TableCell>
              <TableCell>
                <IconButton
                  onClick={() =>
                    handleSaveTranslation(newRow.key, newRow.value)
                  }
                >
                  <Save />
                </IconButton>
              </TableCell>
            </TableRow>
          )}
          {translations.map(translation => (
            <TableRow key={translation.key}>
              <TableCell>{translation.key}</TableCell>
              <TableCell>
                {editingKey === translation.key ? (
                  <TextField
                    value={editingValue}
                    onChange={e => setEditingValue(e.target.value)}
                    fullWidth
                  />
                ) : (
                  translation.value
                )}
              </TableCell>
              <TableCell style={{ minWidth: 128 }}>
                {editingKey === translation.key ? (
                  <IconButton
                    onClick={() =>
                      handleSaveTranslation(translation.key, editingValue)
                    }
                  >
                    <Save />
                  </IconButton>
                ) : (
                  <IconButton
                    onClick={() => {
                      setEditingKey(translation.key);
                      setEditingValue(translation.value);
                    }}
                  >
                    <Edit />
                  </IconButton>
                )}
                <IconButton
                  onClick={() => handleDeleteTranslation(translation.key)}
                >
                  <Delete />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default I18nSettings;
