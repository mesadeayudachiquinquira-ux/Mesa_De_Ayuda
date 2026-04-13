const fs = require('fs');
const { marked } = require('marked');

const style = `
<style>
  body { 
    font-family: 'Segoe UI', system-ui, sans-serif; 
    line-height: 1.6; 
    color: #1e293b; 
    max-width: 850px; 
    margin: 0 auto; 
    padding: 40px; 
    background-color: #ffffff;
  }
  h1 { color: #1e3a8a; font-size: 32px; border-bottom: 3px solid #bfdbfe; padding-bottom: 10px; margin-bottom: 30px; }
  h2 { color: #2563eb; font-size: 24px; margin-top: 30px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }
  h3 { color: #3b82f6; font-size: 18px; margin-top: 20px; }
  p, li { font-size: 15px; color: #475569; }
  ul, ol { padding-left: 20px; }
  li { margin-bottom: 8px; }
  strong { color: #0f172a; }
  code { background: #f1f5f9; padding: 3px 6px; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 13px; color: #dc2626;}
</style>
`;

['Manual_de_Usuario', 'Manual_Tecnico', 'Manual_del_Programador'].forEach(name => {
  if (fs.existsSync(`./manuales/${name}.md`)) {
    const md = fs.readFileSync(`./manuales/${name}.md`, 'utf8');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${name}</title>${style}</head><body>${marked.parse(md)}</body></html>`;
    fs.writeFileSync(`./manuales/${name}.html`, html);
  }
});
console.log('Documentos HTML generados!');
