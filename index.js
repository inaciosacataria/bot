const venom = require('venom-bot');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fetch = require('node-fetch'); // Para fazer a requisição de tradução
const { OpenAI } = require('openai');
const baseURL = "https://api.aimlapi.com/t ";
const apiKey = "3b4f218fe6a64671a16d22bce711411a";
const systemPrompt = "You are a travel agent. Be descriptive and helpful";
const userPrompt = "Tell me about San Francisco";
const api = new OpenAI({
    apiKey,
    baseURL,
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AIzaSyDAZ5WBU64pna61fuzW0h6cKwo8mf6beQg'); // Use a chave correta
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
        candidateCount: 1,
        stopSequences: ["x"],
        maxOutputTokens: 20,
        temperature: 1.0,
    },
});

// Função para gerar resposta usando o modelo generativo
async function generateResponse(userInput, chat) {
    try {
        const result = await chat.sendMessage(userInput);
        const responseText = result.response.text(); // Obtenha o texto gerado pelo Gemini
        return responseText

        // Chama a função de tradução
        // const translatedText = await translateToPortuguese(responseText);
        // console.log('translated text', translatedText);
        // return translatedText; // Retorna o texto traduzido
    } catch (error) {
        console.error('Erro ao gerar resposta:', error.message);
        return 'Desculpe, houve um erro ao processar sua solicitação.';
    }
}

// Função para traduzir o texto usando LibreTranslate
async function translateToPortuguese(text) {
    try {
        const res = await fetch("https://libretranslate.com/translate", {
            method: "POST",
            body: JSON.stringify({
                q: text, // Texto a ser traduzido
                source: "auto", // Detecta automaticamente o idioma
                target: "pt", // Traduz para o português
                format: "text",
                api_key: "" // Deixe vazio ou use a chave se necessário
            }),
            headers: { "Content-Type": "application/json" }
        });

        const data = await res.json();
        console.log("Translated text : ", data)
        return data.translatedText || text;
    } catch (error) {
        console.error('Erro ao traduzir texto:', error.message);
        return text;
    }
}


async function startClient() {
    try {
        const client = await venom.create({
            session: 'my-chat-bot',
            multidevice: true,
            folderNameToken: 'tokens',
            headless: 'new'  // Use 'new' para o modo headless
        });
        start(client);
    } catch (error) {
        console.error('Erro ao iniciar o Venom:', error.message);
    }
}



// const main = async () => {
//
//    try {
//        fetch("https://api.aimlapi.com/chat/completions", {
//            method: "POST",
//            headers: {
//                Authorization: "Bearer "+apiKey,
//                "Content-Type": "application/json",
//            },
//            body: JSON.stringify({
//                model: "gpt-4o",
//                messages: [
//                    {
//                        role: "user",
//                        content: "What kind of model are you?",
//                    },
//                ],
//                max_tokens: 512,
//                stream: false,
//            }),
//        })
//            .then((res) => res.json())
//            .then(console.log);
//     }catch (e) {
//
//         console.log("ERooor:", e.message);
//     }
// };

const main = async () => {

   try {
       const completion = await api.chat.completions.create({
           model: "mistralai/Mistral-7B-Instruct-v0.2",
           messages: [
               {
                   role: "system",
                   content: systemPrompt,
               },
               {
                   role: "user",
                   content: userPrompt,
               },
           ],
           temperature: 0.7,
           max_tokens: 256,
       });

       const response = completion.choices[0].message.content;
       console.log("User:", userPrompt);
       console.log("AI:", response);

    }catch (e) {
        console.log("ERooor:", e);
    }
};



// Inicia o bot
async function start(client) {
    const chat = model.startChat({
        history: [
            {
                role: "user",
                parts: [{ text: "Hello" }],
            },
            {
                role: "model",
                parts: [{ text: "Great to meet you. What would you like to know?" }],
            },
        ],
    });

    client.onMessage(async (message) => {
        console.log('Mensagem recebida:', message); // Inspecione a estrutura da mensagem

        if (!message || !message.body) {
            console.error('Mensagem vazia ou não definida:', message);
            return; // Sai se a mensagem estiver vazia ou não definida
        }

        if (message.body.trim().toLowerCase() === 'sair') {
            await client.sendText(message.from, 'Encerrando o chatbot.');
            return;
        }

        const response = await generateResponse(message.body, chat);
        await client.sendText(message.from, response);
    });
}

// Executa o cliente Venom
//startClient();
main();
