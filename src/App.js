import React, { useState } from "react";
import ChatPopup from "./component/ChatPopup";
//import CSS from "./App.css";

function App(props) {
  const [isChatOpen, setIsChatOpen] = useState(true);

  const closeChatPopup = () => setIsChatOpen(false);

  return (
    <>
      <div>
        <ChatPopup isOpen={isChatOpen} onClose={closeChatPopup} />
      </div>
    </>
  );
}

export default App;
