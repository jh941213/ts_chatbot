// 채팅 관련 기능을 담당하는 모듈
const chatModule = (function() {
    const chatHistory = document.getElementById('chat-history');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    let currentChatId = null;
    let isSending = false;

    function createNewChat(firstMessage) {
        const chatId = Date.now().toString();
        const chatTitle = firstMessage.length > 30 ? firstMessage.substring(0, 30) + "..." : firstMessage;
        const chats = JSON.parse(sessionStorage.getItem('chats') || '[]');
        chats.unshift({ id: chatId, title: chatTitle, messages: [] });
        sessionStorage.setItem('chats', JSON.stringify(chats));
        currentChatId = chatId;
        updateRecentChats();
        clearChatHistory();
        return chatId;
    }

    function addMessage(message, isUser = false) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        messageElement.classList.add(isUser ? 'user-message' : 'bot-message');
        
        const contentElement = document.createElement('div');
        contentElement.classList.add('message-content');
        contentElement.textContent = message;
        messageElement.appendChild(contentElement);

        if (!isUser) {
            const actionsElement = document.createElement('div');
            actionsElement.classList.add('message-actions');

            const copyButton = document.createElement('button');
            copyButton.classList.add('action-button');
            copyButton.innerHTML = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>';
            copyButton.addEventListener('click', () => copyToClipboard(message));
            actionsElement.appendChild(copyButton);

            messageElement.appendChild(actionsElement);
        }

        chatHistory.appendChild(messageElement);
        chatHistory.scrollTop = chatHistory.scrollHeight;

        // 현재 채팅에 메시지 저장
        if (currentChatId) {
            const chats = JSON.parse(sessionStorage.getItem('chats') || '[]');
            const currentChat = chats.find(chat => chat.id === currentChatId);
            if (currentChat) {
                currentChat.messages.push({ content: message, isUser });
                sessionStorage.setItem('chats', JSON.stringify(chats));
            }
        }
    }

    function clearChatHistory() {
        chatHistory.innerHTML = '';
    }

    function loadChat(chatId) {
        const chats = JSON.parse(sessionStorage.getItem('chats') || '[]');
        const chat = chats.find(c => c.id === chatId);
        if (chat) {
            currentChatId = chatId;
            clearChatHistory();
            chat.messages.forEach(msg => addMessage(msg.content, msg.isUser));
        }
    }

    async function sendMessage() {
        if (isSending) return;
        const message = userInput.value.trim();
        if (!message) return;

        isSending = true;
        userInput.value = '';

        try {
            if (!currentChatId) {
                currentChatId = createNewChat(message);
            }
            addMessage(message, true);

            const response = await fetch('/api/chatbot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: message }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }
            addMessage(data.response);
            updateRecentChats();
        } catch (error) {
            console.error('Error:', error);
            addMessage(`오류가 발생했습니다: ${error.message}`);
        } finally {
            isSending = false;
        }
    }

    function updateRecentChats() {
        const recentChatsContainer = document.querySelector('.recent-chats');
        let chats = JSON.parse(sessionStorage.getItem('chats') || '[]');
        chats = chats.slice(0, 10); // 최근 10개의 채팅만 표시
        recentChatsContainer.innerHTML = '';
        chats.forEach(chat => {
            const chatCard = document.createElement('div');
            chatCard.classList.add('chat-card');
            chatCard.innerHTML = `
                <div class="chat-title">${chat.title}</div>
                <div class="chat-time">${formatTime(new Date(parseInt(chat.id)))}</div>
            `;
            chatCard.addEventListener('click', () => loadChat(chat.id));
            recentChatsContainer.appendChild(chatCard);
        });
    }

    function formatTime(date) {
        const now = new Date();
        const diffMinutes = Math.floor((now - date) / (1000 * 60));
        if (diffMinutes < 1) return '방금 전';
        if (diffMinutes < 60) return `${diffMinutes}분 전`;
        const diffHours = Math.floor(diffMinutes / 60);
        if (diffHours < 24) return `${diffHours}시간 전`;
        return `${Math.floor(diffHours / 24)}일 전`;
    }

    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            alert('텍스트가 클립보드에 복사되었습니다.');
        }).catch(err => {
            console.error('클립보드 복사 실패:', err);
        });
    }

    return {
        init: function() {
            userInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    sendMessage();
                }
            });
            sendButton.addEventListener('click', sendMessage);
            updateRecentChats();
        },
        newChat: createNewChat
    };
})();

document.addEventListener('DOMContentLoaded', function() {
    chatModule.init();
});