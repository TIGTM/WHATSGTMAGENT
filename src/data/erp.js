// Simulador simples de dados do ERP

export const getERPData = () => {
    const today = new Date().toLocaleDateString("pt-BR");
    
    return `
    --- RELATÓRIO DO ERP GTM ALIMENTOS (${today}) ---
    
    *Vendas do Dia*: R$ 42.500,00 (15% acima da meta diária).
    *Produtos mais vendidos hoje*: 
      1. Filé de Tilápia GTM (800kg)
      2. Camarão Descascado Q'Pescado (300kg)
      3. Salmão em Postas (120kg)
    
    *Estoque Atual - Posição Estratégica*:
      - Pescados Bem Fresco (Estoque geral): 5.200 kg disponíveis.
      - Q'Pescado (Estoque geral): 3.100 kg disponíveis.
      - *Alerta*: Estoque de Truta Rosa Bem Fresco está abaixo de 20%, necessário repor.
    
    *Logística e Entregas*:
      - Total de pedidos expedidos hoje: 112 caminhões.
      - Atrasos logísticos registrados: 3 ocorrências (Região Metropolitana de BH).
    
    *Clientes*:
      - Novos clientes B2B cadastrados na semana: 15 novos restaurantes.
      - Tíquete médio B2B atual: R$ 1.800,00.
    `;
};
