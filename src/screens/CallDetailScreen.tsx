import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, ALUNO_ID } from '../firebase/config';

type Chamado = {
  description: string;
  photoUri?: string | null;
  address?: string | null;
  status: string;
};

export default function CallDetailScreen({ route }: any) {
  const { chamadoId } = route.params;
  const [chamado, setChamado] = useState<Chamado | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    async function carregarChamado() {
      setLoading(true);
      try {
        const docRef = doc(db, 'alunos', ALUNO_ID, 'chamados', chamadoId);
        const snapshot = await getDoc(docRef);

        if (snapshot.exists()) {
          setChamado(snapshot.data() as Chamado);
        } else {
          Alert.alert('Erro', 'Chamado não encontrado.');
        }
      } catch (error) {
        Alert.alert('Erro', 'Não foi possível carregar os detalhes do chamado.');
      } finally {
        setLoading(false);
      }
    }

    carregarChamado();
  }, [chamadoId]);

  async function mudarStatus(novoStatus: string) {
    setUpdating(true);
    try {
      const docRef = doc(db, 'alunos', ALUNO_ID, 'chamados', chamadoId);
      await updateDoc(docRef, { status: novoStatus });

      // Atualiza o estado local para refletir na tela imediatamente
      setChamado((prev) => (prev ? { ...prev, status: novoStatus } : null));
      Alert.alert('Sucesso', 'Status atualizado!');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar o status. Tente novamente.');
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!chamado) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Chamado não encontrado.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.label}>Status atual</Text>
        <Text style={styles.statusBadge}>{chamado.status.toUpperCase()}</Text>

        <Text style={styles.label}>Descrição do problema</Text>
        <Text style={styles.valueText}>{chamado.description}</Text>

        {chamado.address ? (
          <>
            <Text style={styles.label}>Localização</Text>
            <Text style={styles.valueText}>{chamado.address}</Text>
          </>
        ) : null}

        {chamado.photoUri ? (
          <>
            <Text style={styles.label}>Foto do equipamento</Text>
            <Image source={{ uri: chamado.photoUri }} style={styles.photo} />
          </>
        ) : null}
      </View>

      {/* Ações condicionadas ao status atual */}
      {chamado.status === 'aberto' && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.button, styles.startBtn, updating && styles.disabledButton]}
            disabled={updating}
            onPress={() => mudarStatus('atendendo')}
          >
            <Text style={styles.buttonText}>
              {updating ? 'Aguarde...' : 'Iniciar Atendimento'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.cancelBtn, updating && styles.disabledButton]}
            disabled={updating}
            onPress={() => mudarStatus('cancelado')}
          >
            <Text style={styles.buttonText}>Cancelar Chamado</Text>
          </TouchableOpacity>
        </View>
      )}

      {chamado.status === 'atendendo' && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.button, styles.finishBtn, updating && styles.disabledButton]}
            disabled={updating}
            onPress={() => mudarStatus('concluido')}
          >
            <Text style={styles.buttonText}>
              {updating ? 'Aguarde...' : 'Concluir Atendimento'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {(chamado.status === 'concluido' || chamado.status === 'cancelado') && (
        <View style={styles.finishedContainer}>
          <Text style={styles.finishedText}>Este chamado já foi finalizado.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#666',
    marginTop: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  valueText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  statusBadge: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 4,
  },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 6,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  actionsContainer: {
    gap: 12,
  },
  button: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  startBtn: {
    backgroundColor: '#0077ff',
  },
  finishBtn: {
    backgroundColor: '#17801c',
  },
  cancelBtn: {
    backgroundColor: '#780202',
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  finishedContainer: {
    padding: 16,
    alignItems: 'center',
  },
  finishedText: {
    color: '#888',
    fontStyle: 'italic',
  },
});
