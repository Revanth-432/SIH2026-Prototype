import React from 'react';
import {
  View,
  Text as RNText,
  TextInput as RNTextInput,
  TouchableOpacity,
  ActivityIndicator,
  TextProps,
  TextInputProps,
  ViewProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  EyeOff,
  Pencil,
  Check,
  Truck,
  PackageCheck,
  XCircle,
  MessageCircle,
  Minus,
  Plus,
  Banknote,
  type LucideIcon,
} from 'lucide-react-native';
import {
  useT,
  fontFor,
  weightFromClassName,
  LANGUAGE_OPTIONS,
  type AppLanguage,
  type TranslationKey,
} from '../../i18n';
import { useLanguageStore } from '../../store/useLanguageStore';

/* ------------------------------------------------------------------ */
/* Design tokens (mirrors tailwind.config.js for places needing hex)   */
/* ------------------------------------------------------------------ */
export const COLORS = {
  primary: '#B4461F',
  dark: '#8F3517',
  light: '#F7E9E1',
  amber: '#B45309',
  ink: '#1C1917',
  muted: '#57534E',
  canvas: '#FAF6F0',
  card: '#FFFFFF',
  border: '#E7DDD2',
  success: '#15803D',
  error: '#B91C1C',
  info: '#1D4ED8',
};

/* ------------------------------------------------------------------ */
/* Text — font follows the app language (Mukta / Noto Sans Telugu)    */
/* ------------------------------------------------------------------ */
export function Text({ className, style, ...rest }: TextProps & { className?: string }) {
  const language = useLanguageStore((st) => st.language);
  return (
    <RNText
      className={className}
      style={[{ fontFamily: fontFor(language, weightFromClassName(className)), fontWeight: 'normal' }, style]}
      {...rest}
    />
  );
}

export const Input = React.forwardRef<RNTextInput, TextInputProps & { className?: string }>(
  function Input({ className, style, multiline, ...rest }, ref) {
    const language = useLanguageStore((st) => st.language);
    return (
      <RNTextInput
        ref={ref}
        multiline={multiline}
        placeholderTextColor="#8A817A"
        className={`rounded-xl border-2 border-artisan-border bg-white px-4 text-lg text-artisan-slate ${
          multiline ? 'min-h-[110px] py-3' : 'h-14'
        } ${className ?? ''}`}
        style={[
          {
            fontFamily: fontFor(language, weightFromClassName(className)),
            fontWeight: 'normal',
            textAlignVertical: multiline ? 'top' : 'center',
          },
          style,
        ]}
        {...rest}
      />
    );
  },
);

/** Single-line input with a leading icon and optional trailing element (e.g. show-password). */
export function IconInput({
  icon: Icon,
  right,
  className,
  style,
  ...rest
}: TextInputProps & { icon: LucideIcon; right?: React.ReactNode; className?: string }) {
  return (
    <View className="flex-row items-center">
      <View style={{ position: 'absolute', left: 16, zIndex: 1 }}>
        <Icon color={COLORS.primary} size={22} />
      </View>
      <Input
        {...rest}
        className={`flex-1 ${className ?? ''}`}
        style={[{ paddingLeft: 48, paddingRight: right ? 56 : 16 }, style]}
      />
      {right ? <View style={{ position: 'absolute', right: 4 }}>{right}</View> : null}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Button                                                              */
/* ------------------------------------------------------------------ */
type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';

const BUTTON_STYLES: Record<ButtonVariant, { bg: string; border: string; fg: string }> = {
  primary: { bg: COLORS.primary, border: COLORS.primary, fg: '#FFFFFF' },
  secondary: { bg: '#FFFFFF', border: COLORS.primary, fg: COLORS.primary },
  success: { bg: COLORS.success, border: COLORS.success, fg: '#FFFFFF' },
  danger: { bg: '#FFFFFF', border: COLORS.error, fg: COLORS.error },
  ghost: { bg: 'transparent', border: 'transparent', fg: COLORS.primary },
};

export function Button({
  label,
  sublabel,
  icon: Icon,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  compact = false,
  className,
}: {
  label: string;
  sublabel?: string;
  icon?: LucideIcon;
  onPress?: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  compact?: boolean;
  className?: string;
}) {
  const s = BUTTON_STYLES[variant];
  const { t } = useT();
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      className={`flex-row items-center justify-center rounded-xl px-5 ${className ?? ''}`}
      style={{
        minHeight: compact ? 48 : 58,
        backgroundColor: s.bg,
        borderColor: s.border,
        borderWidth: 2,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {loading ? (
        <>
          <ActivityIndicator color={s.fg} />
          <Text className="ml-3 text-lg font-bold" style={{ color: s.fg }}>
            {t('common.pleaseWait')}
          </Text>
        </>
      ) : (
        <>
          {Icon ? <Icon color={s.fg} size={compact ? 20 : 24} /> : null}
          <View style={{ marginLeft: Icon ? 10 : 0, alignItems: 'center' }}>
            <Text
              className={compact ? 'text-base font-bold' : 'text-lg font-bold'}
              style={{ color: s.fg }}
            >
              {label}
            </Text>
            {sublabel ? (
              <Text className="text-xs font-medium" style={{ color: s.fg, opacity: 0.9, marginTop: -2 }}>
                {sublabel}
              </Text>
            ) : null}
          </View>
        </>
      )}
    </TouchableOpacity>
  );
}

/* ------------------------------------------------------------------ */
/* Layout pieces                                                       */
/* ------------------------------------------------------------------ */
export function Card({ className, children, ...rest }: ViewProps & { className?: string }) {
  return (
    <View className={`rounded-2xl border border-artisan-border bg-white p-4 ${className ?? ''}`} {...rest}>
      {children}
    </View>
  );
}

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  right,
  backDisabled,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  backDisabled?: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View
      className="flex-row items-center border-b border-artisan-border bg-white px-4 pb-3"
      style={{ paddingTop: Math.max(insets.top, 16) + 8 }}
    >
      {onBack ? (
        <TouchableOpacity
          onPress={onBack}
          disabled={backDisabled}
          accessibilityLabel="Back"
          className="mr-3 h-12 w-12 items-center justify-center rounded-xl bg-artisan-light"
        >
          <ArrowLeft color={COLORS.ink} size={26} />
        </TouchableOpacity>
      ) : null}
      <View className="flex-1">
        <Text className="text-xl font-bold text-artisan-slate" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text className="text-sm text-artisan-muted" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <View className="ml-3">{right}</View> : null}
    </View>
  );
}

export function SectionTitle({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <View className="mb-3 mt-2 flex-row items-center justify-between">
      <Text className="text-lg font-bold text-artisan-slate">{title}</Text>
      {right}
    </View>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <View className={`mb-4 ${className ?? ''}`}>
      <Text className="mb-1.5 text-base font-semibold text-artisan-slate">{label}</Text>
      {children}
      {hint && !error ? <Text className="mt-1 text-sm text-artisan-muted">{hint}</Text> : null}
      {error ? <Text className="mt-1 text-sm font-semibold text-artisan-error">{error}</Text> : null}
    </View>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  subtitle,
  action,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <View className="items-center rounded-2xl border-2 border-dashed border-artisan-border bg-white px-6 py-10">
      <View className="h-20 w-20 items-center justify-center rounded-full bg-artisan-light">
        <Icon color={COLORS.primary} size={40} />
      </View>
      <Text className="mt-4 text-center text-xl font-bold text-artisan-slate">{title}</Text>
      {subtitle ? (
        <Text className="mt-1 text-center text-base text-artisan-muted">{subtitle}</Text>
      ) : null}
      {action ? <View className="mt-5 w-full">{action}</View> : null}
    </View>
  );
}

export function Loading({ label }: { label?: string }) {
  const { t } = useT();
  return (
    <View className="flex-1 items-center justify-center py-16">
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text className="mt-3 text-base text-artisan-muted">{label ?? t('common.loading')}</Text>
    </View>
  );
}

export function StatTile({
  icon: Icon,
  value,
  label,
  onPress,
  color = COLORS.primary,
}: {
  icon: LucideIcon;
  value: string | number;
  label: string;
  onPress?: () => void;
  color?: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.8}
      className="flex-1 rounded-2xl border border-artisan-border bg-white p-4"
    >
      <Icon color={color} size={28} />
      <Text className="mt-2 text-3xl font-bold text-artisan-slate">{value}</Text>
      <Text className="text-base font-medium text-artisan-muted" numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/** Selectable pill (filters, sort options). Colours are set via style so toggling is safe. */
export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="h-11 justify-center rounded-full px-4"
      style={{
        backgroundColor: selected ? COLORS.primary : '#FFFFFF',
        borderWidth: 1,
        borderColor: selected ? COLORS.primary : COLORS.border,
      }}
    >
      <Text className="text-base font-semibold" style={{ color: selected ? '#FFFFFF' : COLORS.ink }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/** Large − value + quantity control. */
export function Stepper({
  value,
  onMinus,
  onPlus,
}: {
  value: number;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <View className="flex-row items-center rounded-xl border-2 border-artisan-border bg-white">
      <TouchableOpacity
        onPress={onMinus}
        accessibilityLabel="Decrease quantity"
        className="h-12 w-12 items-center justify-center"
      >
        <Minus color={COLORS.primary} size={22} />
      </TouchableOpacity>
      <Text className="min-w-[36px] text-center text-xl font-bold text-artisan-slate">{value}</Text>
      <TouchableOpacity
        onPress={onPlus}
        accessibilityLabel="Increase quantity"
        className="h-12 w-12 items-center justify-center"
      >
        <Plus color={COLORS.primary} size={22} />
      </TouchableOpacity>
    </View>
  );
}

/** Numbered step indicator for multi-step flows (e.g. capture 1 → 2 → 3). */
export function StepBar({ step, labels }: { step: number; labels: string[] }) {
  return (
    <View className="flex-row items-center justify-center bg-white px-4 py-3">
      {labels.map((label, i) => {
        const n = i + 1;
        const done = n < step;
        const active = n === step;
        return (
          <React.Fragment key={label}>
            {i > 0 ? (
              <View
                style={{
                  height: 3,
                  flex: 1,
                  marginHorizontal: 6,
                  borderRadius: 2,
                  backgroundColor: n <= step ? COLORS.primary : COLORS.border,
                }}
              />
            ) : null}
            <View className="items-center">
              <View
                style={{
                  height: 36,
                  width: 36,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: done || active ? COLORS.primary : '#FFFFFF',
                  borderWidth: 2,
                  borderColor: done || active ? COLORS.primary : COLORS.border,
                }}
              >
                {done ? (
                  <Check color="#FFFFFF" size={20} />
                ) : (
                  <Text
                    className="text-base font-bold"
                    style={{ color: active ? '#FFFFFF' : COLORS.muted }}
                  >
                    {n}
                  </Text>
                )}
              </View>
              <Text
                className="mt-1 text-xs font-semibold"
                style={{ color: active ? COLORS.primary : COLORS.muted }}
              >
                {label}
              </Text>
            </View>
          </React.Fragment>
        );
      })}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Status chip — colour + icon + word, never colour alone              */
/* ------------------------------------------------------------------ */
const STATUS_STYLE: Record<string, { color: string; bg: string; icon: LucideIcon }> = {
  PUBLISHED: { color: COLORS.success, bg: '#DCFCE7', icon: CheckCircle2 },
  IN_REVIEW: { color: COLORS.amber, bg: '#FEF3C7', icon: Clock },
  DRAFT: { color: COLORS.muted, bg: '#F5F5F4', icon: Pencil },
  ARCHIVED: { color: COLORS.muted, bg: '#F5F5F4', icon: EyeOff },
  PENDING: { color: COLORS.amber, bg: '#FEF3C7', icon: Clock },
  CONFIRMED: { color: COLORS.info, bg: '#DBEAFE', icon: Check },
  SHIPPED: { color: COLORS.info, bg: '#DBEAFE', icon: Truck },
  DELIVERED: { color: COLORS.success, bg: '#DCFCE7', icon: PackageCheck },
  CANCELLED: { color: COLORS.error, bg: '#FEE2E2', icon: XCircle },
  OPEN: { color: COLORS.amber, bg: '#FEF3C7', icon: MessageCircle },
  RESPONDED: { color: COLORS.info, bg: '#DBEAFE', icon: MessageCircle },
  CLOSED: { color: COLORS.muted, bg: '#F5F5F4', icon: CheckCircle2 },
};

export function StatusChip({ status }: { status: string }) {
  const { t } = useT();
  const known = STATUS_STYLE[status];
  const s = known ?? { color: COLORS.muted, bg: '#F5F5F4', icon: Clock };
  const label = known ? t(`status.${status}` as TranslationKey) : status;
  const Icon = s.icon;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: s.bg,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 4,
      }}
    >
      <Icon color={s.color} size={15} />
      <Text className="ml-1 text-sm font-bold" style={{ color: s.color }}>
        {label}
      </Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Payment chip — how an order is (or will be) paid                    */
/* ------------------------------------------------------------------ */
export function PaymentChip({ method, status }: { method?: string; status?: string }) {
  const { t } = useT();
  if (!method) return null;
  const paid = status === 'PAID';
  const s =
    method === 'ONLINE'
      ? paid
        ? { color: COLORS.success, bg: '#DCFCE7', icon: CheckCircle2, label: t('pay.paidOnline') }
        : { color: COLORS.amber, bg: '#FEF3C7', icon: Clock, label: t('pay.pending') }
      : { color: COLORS.ink, bg: '#F5F5F4', icon: Banknote, label: t('pay.cod') };
  const Icon = s.icon;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: s.bg,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 4,
      }}
    >
      <Icon color={s.color} size={15} />
      <Text className="ml-1 text-sm font-bold" style={{ color: s.color }}>
        {s.label}
      </Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Language picker — each option is shown in its own script/font       */
/* ------------------------------------------------------------------ */
export function LanguagePicker({
  value,
  onChange,
  variant = 'cards',
}: {
  value: AppLanguage;
  onChange: (language: AppLanguage) => void;
  variant?: 'cards' | 'row';
}) {
  if (variant === 'row') {
    return (
      <View className="flex-row" style={{ gap: 8 }}>
        {LANGUAGE_OPTIONS.map((opt) => {
          const selected = opt.code === value;
          return (
            <TouchableOpacity
              key={opt.code}
              onPress={() => onChange(opt.code)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              className="h-12 flex-1 items-center justify-center rounded-xl"
              style={{
                backgroundColor: selected ? COLORS.primary : '#FFFFFF',
                borderWidth: 2,
                borderColor: selected ? COLORS.primary : COLORS.border,
              }}
            >
              <Text
                style={{
                  fontFamily: fontFor(opt.code, 'bold'),
                  fontSize: 17,
                  color: selected ? '#FFFFFF' : COLORS.ink,
                }}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  return (
    <View style={{ gap: 10 }}>
      {LANGUAGE_OPTIONS.map((opt) => {
        const selected = opt.code === value;
        return (
          <TouchableOpacity
            key={opt.code}
            onPress={() => onChange(opt.code)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            className="flex-row items-center rounded-2xl bg-white p-3"
            style={{ borderWidth: 2, borderColor: selected ? COLORS.primary : COLORS.border }}
          >
            <View
              className="h-12 w-12 items-center justify-center rounded-xl"
              style={{ backgroundColor: selected ? COLORS.primary : COLORS.light }}
            >
              <Text
                style={{
                  fontFamily: fontFor(opt.code, 'bold'),
                  fontSize: 22,
                  color: selected ? '#FFFFFF' : COLORS.primary,
                }}
              >
                {opt.sample}
              </Text>
            </View>
            <Text
              className="ml-3 flex-1"
              style={{ fontFamily: fontFor(opt.code, 'bold'), fontSize: 20, color: COLORS.ink }}
            >
              {opt.label}
            </Text>
            {selected ? <CheckCircle2 color={COLORS.primary} size={26} /> : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
