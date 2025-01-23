import React, { useState, useRef, useEffect } from "react";
import botImg from "../assest/Images/chaticon2.png";
import "../assest/css/popupstyle.css"; // Make sure this file contains all your CSS

const queryParams = new URLSearchParams(window.location.search);
const modelString = queryParams.get("model");
console.log(modelString);

function ChatPopup({ isOpen, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const chatBoxRef = useRef(null);
  const inputRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState(null);
  const [modules, setModules] = useState([]);
  const [clientData, setClientData] = useState({
    clientId: null,
    clientName: null,
    clientBotName: null,
    assistantId: null,
    bearerToken: null,
    expiryDate: null,
    activeFlag: null,
    createdOn: null,
    updatedOn: null,
  });

  const fetchClientData = async () => {
    try {
      const response = await fetch(
        `http://qms.digital.logicsoft.online:8081/gateway/chatbot/bot/getClientId/${modelString}`,
        {}
      );
      // Handle response if successful
      if (response.ok) {
        const data = await response.json();
        // Store the response data in state, if not null
        setClientData({
          clientId: data.clientId || null,
          clientName: data.clientName || null,
          clientBotName: data.clientBotName || null,
          assistantId: data.assistantId || null,
          bearerToken: data.bearerToken || null,
          expiryDate: data.expiryDate || null,
          activeFlag: data.activeFlag || null,
          createdOn: data.createdOn || null,
          updatedOn: data.updatedOn || null,
        });
      } else {
        console.error("Error fetching client data", response.status);
      }
    } catch (error) {
      console.error("API call error:", error);
    }
  };

  const createThread = async () => {
    try {
      const headers = {
        Authorization: `Bearer ${clientData.bearerToken}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "assistants=v2",
      };
      const body = JSON.stringify({
        model: "gpt-4o-mini", // or any other model from the list
      });
      const response = await fetch("https://api.openai.com/v1/threads", {
        method: "POST",
        headers: headers,
        body: body,
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error response from API:", errorData);
        return;
      }

      const data = await response.json();

      if (data && data.id) {
        setThreadId(data.id);
      } else {
        console.error("Thread ID not returned from API.");
      }
    } catch (error) {
      console.error("Error creating thread:", error);
    }
  };
  useEffect(() => {
    fetchClientData();
    createThread();
  }, [clientData.bearerToken]);

  const getCurrentTime = () => {
    const date = new Date();
    let hours = date.getHours();
    const minutes = date.getMinutes();
    //const seconds = date.getSeconds();
    const period = hours >= 12 ? "pm" : "am";
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const minutesFormatted = minutes < 10 ? `0${minutes}` : minutes;
    //const secondsFormatted = seconds < 10 ? `0${seconds}` : seconds;
    return `${hours}:${minutesFormatted} ${period}`;
  };

  const handleButtonClic = (type) => {
    if (type === "trackApplication") {
      // Fetch the options each time the button is clicked
      fetch(
        `http://qms.digital.logicsoft.online:8081/gateway/chatbot/bot/getModulesByClientId/${modelString}`
      )
        .then((response) => response.json())
        .then((data) => {
          setModules(data); // Update the modules state with the fetched data
        })
        .catch((error) => {
          console.error("Error fetching modules:", error);
        });
    }
  };
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);
  const handleTAClick = (action) => {
    if (action === "Track Application") {
      const newMessage = (
        <div
          className="messageContainer theirMessageContainer"
          key={Date.now()}
        >
          <img src={botImg} alt="Bot Avatar" className="avatar" />
          <div className="message theirMessage">
            <span className="text">
              Please enter your Application Tracking ID:
            </span>
            <div className="inputContainer">
              <input className="customInput" ref={inputRef} type="text" />
              <button
                className="button"
                onClick={() => handleButtonClickTA("Track Application")}
              >
                Get Application Status
              </button>
            </div>
            <div className="time">{getCurrentTime()}</div>
          </div>
        </div>
      );
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    }
  };

  const handleButtonClickTA = (action) => {
    const trackingId = inputRef.current.value;
    if (action === "Track Application") {
      if (!trackingId) {
        alert("Please enter your Application Tracking ID.");
        return;
      }

      const apiUrl = `https://fctest.fssai.gov.in/gateway/commonauth/commonapi/gettrackapplicationdetails/${trackingId}`;

      fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to fetch application status.");
          }
          return response.json();
        })
        .then((data) => {
          const applicationData = data[0]; // Assuming the API returns an array

          const messageText = [
            <strong>Application Status:</strong>,
            ` ${applicationData.statusDesc || "Unknown"}`,
            <br />,
            <strong>Company Name:</strong>,
            ` ${applicationData.companyName || "Not Available"}`,
            <br />,
            <strong>License Category:</strong>,
            ` ${applicationData.licenseCategoryName || "Not Available"}`,
            <br />,
            <strong>Address:</strong>,
            ` ${applicationData.addressPremises || "Not Available"}`,
            <br />,
            <strong>District:</strong>,
            ` ${applicationData.districtName || "Not Available"}`,
            <br />,
            <strong>State:</strong>,
            ` ${applicationData.stateName || "Not Available"}`,
            <br />,
            <strong>Pincode:</strong>,
            ` ${applicationData.premisePincode || "Not Available"}`,
            <br />,
            <strong>Application Type:</strong>,
            ` ${applicationData.apptypeDesc || "Not Available"}`,
            <br />,
            <strong>Submission Date:</strong>,
            ` ${applicationData.appSubmissionDate || "Not Available"}`,
          ];
          setMessages((prev) => [
            ...prev,
            {
              text: messageText,
              sender: "Bot",
              time: getCurrentTime(),
            },
          ]);
        })
        .catch((error) => {
          console.log(error);
          const errorMessageText = [
            "Error: Unable to retrieve the application status. Please try again later.",
          ];

          setMessages((prev) => [
            ...prev,
            {
              text: errorMessageText,
              sender: "Bot",
              time: getCurrentTime(),
            },
          ]);
        });
    }
  };
  const user = {
    isActive: clientData.activeFlag,
    subscriptionDate: clientData.expiryDate,
  };

  const checkUserStatus = () => {
    //setMessages([...messages, { text: input, sender: "You" }]);
    const currentDate = new Date();
    const subscriptionEndDate = new Date(user.subscriptionDate);

    if (!user.isActive) {
      return {
        isValid: false,
        message: "User is inactive. Please contact support.",
      };
    }

    if (subscriptionEndDate < currentDate) {
      return {
        isValid: false,
        message:
          "Your subscription is expired. Please renew your subscription.",
      };
    }
    setInput("");
    return { isValid: true };
  };

  const handleSend = async () => {
    const status = checkUserStatus();

    if (!status.isValid) {
      const currentTime = getCurrentTime();
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          text: status.message,
          sender: "Bot",
          time: currentTime,
          style: { color: "red", fontSize: "20px" },
        },
      ]);
      return; // Terminate the function
    }

    const baseApiUrl = `https://api.openai.com/v1/threads/${threadId}`;
    const assistantId = `${clientData.assistantId}`;
    const authorizationToken = `Bearer ${clientData.bearerToken}`;
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");

    setMessages((prevMessages) => [
      ...prevMessages,
      {
        sender: "You",
        text: userMessage,
        time: getCurrentTime(),
      },
    ]);

    setMessages((prevMessages) => [
      ...prevMessages,
      {
        sender: "Bot",
        text: [""],
        time: getCurrentTime(),
        isTyping: true,
      },
    ]);
    setIsLoading(true);

    try {
      // Send user message to the API
      const messageSettings = {
        method: "POST",
        headers: {
          "OpenAI-Beta": "assistants=v2",
          Authorization: authorizationToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          role: "user",
          content: [{ type: "text", text: userMessage }],
        }),
      };

      await fetch(`${baseApiUrl}/messages`, messageSettings);

      const runSettings = {
        method: "POST",
        headers: {
          "OpenAI-Beta": "assistants=v2",
          Authorization: authorizationToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assistant_id: assistantId,
          stream: true,
        }),
      };

      const response = await fetch(`${baseApiUrl}/runs`, runSettings);

      if (!response.body) throw new Error("Response body is not readable.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      let done = false;

      while (!done) {
        const { value, done: streamDone } = await reader.read();
        done = streamDone;

        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          const lines = buffer.split("\n");
          buffer = lines.pop();

          lines.forEach((line) => {
            if (line.startsWith("data: ")) {
              const cleanedLine = line.replace(/^data: /, "");
              if (cleanedLine === "[DONE]") return;

              try {
                const jsonData = JSON.parse(cleanedLine);
                if (
                  jsonData.object === "thread.message.delta" &&
                  jsonData.delta?.content?.length > 0
                ) {
                  const token = jsonData.delta.content[0].text.value || "";

                  setMessages((prevMessages) => {
                    const updatedMessages = [...prevMessages];
                    const lastMessage = updatedMessages.pop();

                    if (lastMessage && lastMessage.isTyping) {
                      const currentText = String(lastMessage.text || ""); // Ensure text is a string
                      if (!currentText.endsWith(token)) {
                        console.log(getCurrentTime());
                        lastMessage.text = currentText + token;
                      }
                      updatedMessages.push(lastMessage);
                    } else {
                      updatedMessages.push({
                        sender: "bot",
                        text: token || "", // Initialize text as a string
                        isTyping: true,
                      });
                    }

                    return updatedMessages;
                  });
                }
              } catch (e) {
                console.error("Error processing line:", line, e);
              }
            }
          });
        }
      }
      console.log(getCurrentTime());
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while fetching the response.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    isOpen && (
      <div className="popupContainer">
        <div></div>
        <div className="popupHeader">
          <div className="greeting">
            <p>Hi !</p>
          </div>
          <div className="description">
            <p>
              Welcome to FSSAI! I am Food Safety Health Assistant (FSHA)
              Chatbot, your personal assistant here to help with any
              FSSAI-related queries. Feel free to ask me more by choosing one of
              the options below. I am here to assist you on your export journey.
            </p>
          </div>
          <button className="closeButton" onClick={onClose}></button>
        </div>

        <div className="chatBox" ref={chatBoxRef}>
          {/* Initial hardcoded message */}
          <div className="messageContainer theirMessageContainer">
            <img src={botImg} alt="Bot Avatar" className="avatar" />
            <div className="message theirMessage">
              <span className="text">
                Hello! Welcome to FSSAI! How can I assist you today?
              </span>
              {clientData.activeFlag && (
                <div className="buttonsContainer">
                  <button
                    className="button"
                    onClick={() => handleButtonClic("generalQuery")}
                  >
                    General Query
                  </button>
                  <button
                    className="button"
                    onClick={() => handleButtonClic("trackApplication")}
                  >
                    Track Application/Complaint/FBO
                  </button>
                </div>
              )}
            </div>
          </div>
          {modules.length > 0 && (
            <div className="messageContainer theirMessageContainer">
              <img src={botImg} alt="Bot Avatar" className="avatar" />
              <div className="message theirMessage">
                <span className="text">Select an option:</span>
                <div className="buttonsContainer">
                  {modules.map((module, index) => (
                    <button
                      key={module.moduleId}
                      className="button"
                      onClick={() => handleTAClick(module.clientBotName)}
                    >
                      {module.clientName}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          {messages.map((message, index) => {
            // Check if `message` is a JSX element
            if (React.isValidElement(message)) {
              return React.cloneElement(message, { key: index });
            }
            return (
              <div
                className={`messageContainer ${
                  message.sender === "You"
                    ? "myMessageContainer"
                    : "theirMessageContainer"
                }`}
                key={index}
                style={message.style || {}}
              >
                {message.sender === "Bot" && (
                  <img src={botImg} alt="Bot Avatar" className="avatar" />
                )}
                <div
                  className={`message ${
                    message.sender === "You" ? "myMessage" : "theirMessage"
                  }`}
                >
                  {Array.isArray(message.text)
                    ? message.text.map((item, idx) => (
                        <span key={idx}>{item}</span>
                      ))
                    : message.text}
                  <div className="time">{message.time}</div>
                </div>
              </div>
            );
          })}
          {isLoading && (
            <div className="messageContainer theirMessageContainer">
              <div className="chatbot-loading">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            </div>
          )}
        </div>
        <div className="inputContainer">
          <input
            type="text"
            className="input"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
          />
          <button className="buttonSend" onClick={handleSend}>
            Send
          </button>
        </div>
      </div>
    )
  );
}
export default ChatPopup;
