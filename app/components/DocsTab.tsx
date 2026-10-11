import { Terminal } from "lucide-react";
import { useKios } from "../hooks/KiosContext";

export function DocsTab() {
  return (
        <div className="bg-[#161619]/60 border border-white/[0.07] rounded-xl p-6 space-y-6">
          <div>
            <h2 className="text-base font-bold text-white mb-1">Panduan Integrasi OpenAI SDK</h2>
            <p className="text-xs text-slate-400">
              KiosAI 100% kompatibel dengan OpenAI client di Python, JavaScript/TypeScript, dan cURL.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-xs font-semibold text-slate-300 mb-1">cURL (Terminal):</div>
              <pre className="bg-[#0D0D0F] p-4 rounded-xl border border-white/[0.07] text-xs text-blue-300 font-mono overflow-x-auto">
{`curl http://localhost:3000/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer kios-your-api-key" \\
  -d '{
    "model": "tokenharbor/deepseek-v4.1-flash:free",
    "messages": [{"role": "user", "content": "Halo KiosAI"}],
    "stream": true
  }'`}
              </pre>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-300 mb-1">Python (openai package):</div>
              <pre className="bg-[#0D0D0F] p-4 rounded-xl border border-white/[0.07] text-xs text-emerald-300 font-mono overflow-x-auto">
{`from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:3000/v1",
    api_key="kios-your-api-key"
)

response = client.chat.completions.create(
    model="tokenharbor/deepseek-v4.1-flash:free",
    messages=[{"role": "user", "content": "Halo!"}]
)
print(response.choices[0].message.content)`}
              </pre>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-300 mb-1">Node.js (openai npm):</div>
              <pre className="bg-[#0D0D0F] p-4 rounded-xl border border-white/[0.07] text-xs text-amber-300 font-mono overflow-x-auto">
{`import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "http://localhost:3000/v1",
  apiKey: "kios-your-api-key",
});

const completion = await openai.chat.completions.create({
  model: "tokenharbor/deepseek-v4.1-flash:free",
  messages: [{ role: "user", content: "Halo!" }],
});
console.log(completion.choices[0].message.content);`}
              </pre>
            </div>
          </div>
        </div>
  );
}
