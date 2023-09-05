import React, { useState } from "react";
import {
  AppBar,
  Typography,
  Container,
  Grid,
  Paper,
  Box,
  Avatar,
  TextField,
  FormControlLabel,
  Toolbar,
  Checkbox,
  Button,
  Link,
  CircularProgress,
  ThemeProvider,
  createTheme,
  CssBaseline,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import axios from "axios";
import UploadFileIcon from "@mui/icons-material/UploadFile";

import image from "./file---illustration-1093457270-04c29b6d0a61449fb145c05deeb660c9.webp";
// import image from "./download.png";
const defaultTheme = createTheme();

const Page = () => {
  const apiUrl = process.env.REACT_APP_API_URL;
  const [file, setFile] = useState(null);
  const [responseMessage, setResponseMessage] = useState("");
  const [responseLink, setResponseLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
    console.log(file);
  };

  const handleFileUpload = (event) => {
    event.preventDefault();
    if (file) {
      if (file.type === "application/pdf") {
        setIsLoading(true);

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => {
          const base64File = reader.result.split(",")[1];
          console.log("Base64 Encoded File:", base64File);
          const fileName = file.name;
          axios
            .post(apiUrl, { base64File: base64File, key: file })
            .then((response) => {
              console.log("API call successful:", response);
              setIsLoading(false);
              setResponseMessage(response.data.body.message);
              // setResponseLink(response.data.body.txtDownloadLink);
              if (response.data.body.txtDownloadLink) {
                setResponseLink(response.data.body.txtDownloadLink);
              } else {
                setResponseLink("");
              }
            })
            .catch((error) => {
              console.error("Error:", error);
            });
        };
      } else {
        alert("Please upload a PDF file.");
      }
    } else {
      alert("Please select a file to upload.");
    }
  };

  return (
    <ThemeProvider theme={defaultTheme}>
      {/* <AppBar position="static">
        <Toolbar>
          <Typography variant="h6">NSFW Detector</Typography>
        </Toolbar>
      </AppBar> */}
      <Grid container component="main" sx={{ height: "100vh" }}>
        <CssBaseline />
        <Grid
          item
          xs={false}
          sm={4}
          md={7}
          sx={{
            backgroundImage: `url(${image})`,
            backgroundRepeat: "no-repeat",
            backgroundColor: (t) =>
              t.palette.mode === "light"
                ? t.palette.grey[50]
                : t.palette.grey[900],
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
          <Box
            sx={{
              my: 8,
              mx: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Avatar sx={{ mt: 10, bgcolor: "secondary.main" }}>
              <UploadFileIcon />
            </Avatar>
            <Typography component="h1" variant="h5">
              Upload File
            </Typography>
            <Box
              component="form"
              noValidate
              // onSubmit={handleFileUpload}
              sx={{ mt: 1 }}
            >
              <Box border={1} p={2} textAlign="center">
                <input type="file" onChange={handleFileChange} />
              </Box>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                sx={{ mt: 3, mb: 2 }}
                onClick={handleFileUpload}
              >
                Upload
              </Button>
              {isLoading && <CircularProgress sx={{ mt: 3 }} />}
              {responseMessage && (
                <Paper
                  elevation={3}
                  style={{ padding: "10px", marginTop: "10px" }}
                >
                  <Typography variant="body1">{responseMessage}</Typography>
                  {responseLink !== "" && (
                    <Typography variant="body1">
                      <a
                        href={responseLink}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Download File
                      </a>
                    </Typography>
                  )}
                </Paper>
              )}
            </Box>
          </Box>
        </Grid>
      </Grid>
    </ThemeProvider>
  );
};

export default Page;
