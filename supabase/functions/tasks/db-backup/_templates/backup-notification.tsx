import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Hr,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface BackupNotificationEmailProps {
  adminName: string;
  backupDate: string;
  filename: string;
  size: string;
  status: 'success' | 'failed';
  url?: string;
  error?: string;
}

export const BackupNotificationEmail = ({
  adminName,
  backupDate,
  filename,
  size,
  status,
  url,
  error
}: BackupNotificationEmailProps) => (
  <Html>
    <Head />
    <Preview>
      {status === 'success' 
        ? `Backup do banco realizado com sucesso - ${filename}` 
        : 'Falha no backup do banco de dados'
      }
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>
          {status === 'success' ? '✅ Backup Realizado' : '❌ Falha no Backup'}
        </Heading>
        
        <Text style={text}>
          Olá {adminName},
        </Text>
        
        {status === 'success' ? (
          <>
            <Text style={text}>
              O backup automático do banco de dados foi realizado com sucesso em {backupDate}.
            </Text>
            
            <Section style={infoBox}>
              <Text style={infoTitle}>Detalhes do Backup:</Text>
              <Text style={infoText}>
                <strong>Arquivo:</strong> {filename}
              </Text>
              <Text style={infoText}>
                <strong>Tamanho:</strong> {size}
              </Text>
              <Text style={infoText}>
                <strong>Data:</strong> {backupDate}
              </Text>
              {url && (
                <Text style={infoText}>
                  <strong>Localização:</strong> AWS S3
                </Text>
              )}
            </Section>
            
            <Text style={text}>
              O backup está armazenado com segurança no Amazon S3 e pode ser usado para 
              restauração em caso de necessidade.
            </Text>
          </>
        ) : (
          <>
            <Text style={text}>
              O backup automático do banco de dados falhou em {backupDate}.
            </Text>
            
            <Section style={errorBox}>
              <Text style={errorTitle}>Detalhes do Erro:</Text>
              <Text style={errorText}>
                {error || 'Erro não especificado'}
              </Text>
            </Section>
            
            <Text style={text}>
              Por favor, verifique os logs do sistema e tente executar o backup manualmente 
              se necessário.
            </Text>
          </>
        )}
        
        <Hr style={hr} />
        
        <Text style={footer}>
          Este é um email automático do sistema de backup da Perfumaria.
          <br />
          Não responda a este email.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default BackupNotificationEmail;

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
};

const infoBox = {
  backgroundColor: '#f8f9fa',
  border: '1px solid #e9ecef',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
};

const errorBox = {
  backgroundColor: '#fff5f5',
  border: '1px solid #fed7d7',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
};

const infoTitle = {
  color: '#2d3748',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 12px 0',
};

const errorTitle = {
  color: '#c53030',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 12px 0',
};

const infoText = {
  color: '#4a5568',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '8px 0',
};

const errorText = {
  color: '#c53030',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '8px 0',
  fontFamily: 'monospace',
  backgroundColor: '#fed7d7',
  padding: '8px',
  borderRadius: '4px',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  textAlign: 'center' as const,
};