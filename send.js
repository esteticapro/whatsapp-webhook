export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, message } = req.body;

  if (!to || !message) {
    return res.status(400).json({ error: 'Missing "to" or "message"' });
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v20.0/848348005022600/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer EAAP9ZCFGgqlcBPnHIwEgdWBw5u4QcZB9cuJxVCzxDCokZAt9M7EFjB7Co57OE0NsNb9LOiqsQM1C`, // seu token de acesso
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body: message },
        }),
      }
    );

    const data = await response.json();

    if (response.ok) {
      return res.status(200).json({ success: true, data });
    } else {
      return res.status(400).json({ success: false, data });
    }
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
