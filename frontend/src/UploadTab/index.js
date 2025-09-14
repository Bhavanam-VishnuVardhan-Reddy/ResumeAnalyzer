import { Component } from "react";
import styles from "./UploadTab.module.css";

class UploadTab extends Component{

    state = {selectedFile:null,errMsg:'',successMsg:''}

    handleFileChange=(event)=>{
        this.setState({
            selectedFile:event.target.files[0]
        })
    }

    onClickUploadButton = async () => {
  const { selectedFile } = this.state
  if (selectedFile !== null) {
    const formData = new FormData()
    formData.append("file", selectedFile, selectedFile.name)

    try {
      const response = await fetch("http://127.0.0.1:8000/api/upload", {
        method: "POST",
        body: formData
    })


      if (response.ok) {
        const data = await response.json()
        console.log("Upload success:", data)
      } else {
        console.error("Upload failed", response.status)
      }
    } catch (err) {
      console.error("Fetch error:", err)
    }
  } else {
    this.setState({
      errMsg: "Please Upload a PDF File"
    })
  }
}


    render(){
        const {errMsg,successMsg}=this.state
    return(
      <form className={styles.uploadForm} onSubmit={e => e.preventDefault()}>
        <label htmlFor="file">Upload Resume (PDF):</label>
        <input type="file" id="file" accept="application/pdf" onChange={this.handleFileChange}/>
        <input type="button" value="Upload" onClick={this.onClickUploadButton}/>
        {errMsg && <p className={styles.errorMessage}>{errMsg}</p>}
        {successMsg && <p style={{color:'green'}}>{successMsg}</p>}
      </form>
    )
    }
}

export default UploadTab