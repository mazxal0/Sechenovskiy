import { useMemo, useRef, useState } from 'react';
import { Button, Card, Divider, Form, Input, Radio, Space, Typography, message } from 'antd';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import type { Role } from '../shared/types';
import { ROLE_LABEL } from '../shared/types';
import { fakeAiGenerateAnswer, streamText } from '../shared/stream';

const { Text, Title } = Typography;

const schema = z.object({
  role: z.enum(['doctor', 'patient']),
  prompt: z
    .string()
    .trim()
    .min(5, 'Вставь текст (минимум 5 символов).')
    .max(10_000, 'Слишком длинно (макс 10k символов).'),
});

type FormValues = z.infer<typeof schema>;

export function AiChatPage() {
  const [answer, setAnswer] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      role: 'patient',
      prompt: '',
    },
    mode: 'onChange',
  });

  const role = watch('role');

  const roleHint = useMemo(() => {
    const r: Role = role;
    return r === 'doctor'
      ? 'Тон: клинический, структурированный. Можно термины.'
      : 'Тон: простыми словами, спокойно, без сложных терминов.';
  }, [role]);

  const stopStreaming = () => {
    abortRef.current?.abort();
  };

  const onSubmit = async (values: FormValues) => {
    // Если уже идёт генерация — прервём
    stopStreaming();
    abortRef.current = new AbortController();

    setAnswer('');
    setIsStreaming(true);

    try {
      const full = await fakeAiGenerateAnswer({
        role: values.role,
        input: values.prompt,
        signal: abortRef.current.signal,
      });

      await streamText(
        full,
        (chunk) => setAnswer((prev) => prev + chunk),
        { chunkSize: 6, delayMs: 18, signal: abortRef.current.signal }
      );
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        message.error('Ошибка генерации (заглушка).');
      }
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card>
        <Title level={3} style={{ marginTop: 0 }}>
          AI-помощник
        </Title>

        <Text type="secondary">
          Выбери роль, вставь текст и получи ответ.
        </Text>

        <Divider />

        <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
          <Form.Item
            label="Роль"
            help={<Text type="secondary">{roleHint}</Text>}
            validateStatus={errors.role ? 'error' : undefined}
          >
            <Controller
              control={control}
              name="role"
              render={({ field }) => (
                <Radio.Group
                  {...field}
                  optionType="button"
                  buttonStyle="solid"
                  options={[
                    { label: ROLE_LABEL.doctor, value: 'doctor' },
                    { label: ROLE_LABEL.patient, value: 'patient' },
                  ]}
                />
              )}
            />
          </Form.Item>

          <Form.Item
            label="Текст"
            validateStatus={errors.prompt ? 'error' : undefined}
            help={errors.prompt?.message}
          >
            <Controller
              control={control}
              name="prompt"
              render={({ field }) => (
                <Input.TextArea
                  {...field}
                  placeholder={
                    role === 'doctor'
                      ? 'Например: выписка/анамнез/жалобы пациента...'
                      : 'Например: что беспокоит, симптомы, анализы...'
                  }
                  autoSize={{ minRows: 6, maxRows: 14 }}
                />
              )}
            />
          </Form.Item>

          <Space>
            <Button
              type="primary"
              htmlType="submit"
              loading={isSubmitting || isStreaming}
              disabled={isSubmitting || isStreaming}
            >
              Отправить
            </Button>

            <Button
              onClick={stopStreaming}
              disabled={!isStreaming}
              danger
            >
              Стоп
            </Button>
          </Space>
        </Form>
      </Card>

      <Card title="Ответ" extra={isStreaming ? <Text type="secondary">печатает…</Text> : null}>
        {answer ? (
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {answer}
          </pre>
        ) : (
          <Text type="secondary">Пока пусто. Отправь текст — тут появится ответ.</Text>
        )}
      </Card>
    </Space>
  );
}
