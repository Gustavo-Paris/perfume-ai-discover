-- Criar usuário teste para demonstração
INSERT INTO profiles (id, name, email) VALUES 
('11111111-1111-1111-1111-111111111111', 'João Silva', 'joao.silva@teste.com'),
('22222222-2222-2222-2222-222222222222', 'Maria Santos', 'maria.santos@teste.com')
ON CONFLICT (id) DO NOTHING;