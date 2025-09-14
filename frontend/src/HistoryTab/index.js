
import { Component } from "react";
import { useNavigate } from 'react-router-dom';

import styles from "./HistoryTab.module.css";

class HistoryTab extends Component {
  state = { resumes: [], errMsg: "", loading: false };

  componentDidMount() {
    this.resumeData();
  }

  resumeData = async () => {
    this.setState({ loading: true, errMsg: "" });
    try {
      const response = await fetch("http://127.0.0.1:8000/api/resumes");
      if (response.ok) {
        const data = await response.json();
        this.setState({ resumes: data.body, loading: false });
      } else {
        this.setState({ errMsg: `Failed to fetch resumes (Status: ${response.status})`, loading: false });
      }
    } catch (e) {
      this.setState({ errMsg: `Error: ${e.message}`, loading: false });
    }
  };

  onClickDetailsButton = (id) => {
    if (this.props.navigate) {
      this.props.navigate(`/resumes/${id}`);
    } else {
      window.location.href = `/resumes/${id}`;
    }
  };

  render() {
    const { resumes, errMsg, loading } = this.state;

    return (
      <div className={styles.resumeList}>
        <h2>Uploaded Resumes</h2>
        {loading && <p>Loading...</p>}
        {errMsg && <p className={styles.errorMessage}>{errMsg}</p>}

        <ul>
          {resumes.map((element) => (
            <li key={element.id}>
              <h3>{element.name || "Unknown Name"}</h3>
              <p>Email: {element.email || "N/A"}</p>
              <p>Phone: {element.phone || "N/A"}</p>
              <input type="button" value="Details" onClick={() => this.onClickDetailsButton(element.id)} />
            </li>
          ))}
        </ul>
      </div>
    );
  }
}



function HistoryTabWithNavigate(props) {
  const navigate = useNavigate();
  return <HistoryTab {...props} navigate={navigate} />;
}

export default HistoryTabWithNavigate;
