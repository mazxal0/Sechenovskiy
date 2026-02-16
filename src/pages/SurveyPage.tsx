import { Button, Card, Form, Input, Radio, Space, Typography, message } from 'antd';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { ROLE_LABEL } from '../shared/types';

const { Text, Title } = Typography;

const schema = z.object({
  role: z.enum(['doctor', 'patient']),
  name: z.string().trim().min(2, 'Минимум 2 символа.').max(80),
  email: z.string().trim().email('Некорректный email.').max(120),
  // пару полей, которые ты потом расширишь:
  specialty: z.string().trim().max(120).optional(), // для doctor
  symptoms: z.string().trim().max(2000).optional(), // для patient
});

type SurveyValues = z.infer<typeof schema>;

export function SurveyPage() {
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<SurveyValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      role: 'patient',
      name: '',
      email: '',
      specialty: '',
      symptoms: '',
    },
    mode: 'onChange',
  });

  const role = watch('role');

  const onSubmit = async (values: SurveyValues) => {
    // Заглушка — потом отправишь на свой backend
    await new Promise((r) => setTimeout(r, 200));
    message.success('Опрос отправлен (заглушка).');
    console.log('survey submit', values);
    reset({ ...values, name: '', email: '' });
  };

  return (
    <Card>
      <Title level={3} style={{ marginTop: 0 }}>
        Опрос для участников
      </Title>
      <Text type="secondary">
        Минимальная форма на react-hook-form + antd. Добавишь остальные поля сам.
      </Text>

      <Form layout="vertical" onFinish={handleSubmit(onSubmit)} style={{ marginTop: 16 }}>
        <Form.Item label="Роль" validateStatus={errors.role ? 'error' : undefined}>
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
          label="Имя"
          validateStatus={errors.name ? 'error' : undefined}
          help={errors.name?.message}
        >
          <Controller
            control={control}
            name="name"
            render={({ field }) => <Input {...field} placeholder="Иван Иванов" />}
          />
        </Form.Item>

        <Form.Item
          label="Email"
          validateStatus={errors.email ? 'error' : undefined}
          help={errors.email?.message}
        >
          <Controller
            control={control}
            name="email"
            render={({ field }) => <Input {...field} placeholder="name@example.com" />}
          />
        </Form.Item>

        {role === 'doctor' ? (
          <Form.Item
            label="Специальность (для врача)"
            validateStatus={errors.specialty ? 'error' : undefined}
            help={errors.specialty?.message}
          >
            <Controller
              control={control}
              name="specialty"
              render={({ field }) => <Input {...field} placeholder="Терапевт / Хирург / ... (заглушка)" />}
            />
          </Form.Item>
        ) : (
          <Form.Item
            label="Кратко: что беспокоит (для пациента)"
            validateStatus={errors.symptoms ? 'error' : undefined}
            help={errors.symptoms?.message}
          >
            <Controller
              control={control}
              name="symptoms"
              render={({ field }) => (
                <Input.TextArea {...field} autoSize={{ minRows: 3, maxRows: 8 }} placeholder="Симптомы, длительность, температура..." />
              )}
            />
          </Form.Item>
        )}

        <Space>
          <Button type="primary" htmlType="submit" loading={isSubmitting}>
            Отправить
          </Button>
          <Button htmlType="button" onClick={() => reset()}>
            Сброс
          </Button>
        </Space>
      </Form>
    </Card>
  );
}
