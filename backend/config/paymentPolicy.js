export const PAYMENT_POLICIES = {
  CREDIT_DEBIT: 'credit_debit',
  CREDIT_DEBIT_ONE_INSTALLMENT: 'credit_debit_one_installment',
  DEBIT_ONLY: 'debit_only'
};

/**
 * Obtiene la política de pago configurada en el entorno
 * @returns {'credit_debit' | 'credit_debit_one_installment' | 'debit_only'}
 */
export const getPaymentPolicy = () => {
  const policy = (process.env.PAYMENT_POLICY || PAYMENT_POLICIES.CREDIT_DEBIT).toLowerCase().trim();
  if (Object.values(PAYMENT_POLICIES).includes(policy)) {
    return policy;
  }
  return PAYMENT_POLICIES.CREDIT_DEBIT;
};

/**
 * Valida si un pago cumple con la política configurada en el backend
 * @param {string} policy
 * @param {{ installments: number, payment_type_id?: string }} data
 * @returns {{ valid: boolean, message?: string }}
 */
export const validatePaymentPolicy = (policy, { installments = 1, payment_type_id = '' }) => {
  const numInstallments = Number(installments) || 1;
  const type = String(payment_type_id || '').toLowerCase();

  // (c) "debit_only": solo débito, excluyendo tarjeta de crédito
  if (policy === PAYMENT_POLICIES.DEBIT_ONLY) {
    if (type === 'credit_card') {
      return {
        valid: false,
        message: 'Política de pago: Esta tienda actualmente solo acepta pagos con tarjeta de débito.'
      };
    }
    if (numInstallments > 1) {
      return {
        valid: false,
        message: 'Política de pago: Los pagos con tarjeta de débito solo pueden realizarse en 1 cuota.'
      };
    }
  }

  // (b) "credit_debit_one_installment": crédito y débito limitado a 1 sola cuota
  if (policy === PAYMENT_POLICIES.CREDIT_DEBIT_ONE_INSTALLMENT) {
    if (numInstallments > 1) {
      return {
        valid: false,
        message: 'Política de pago: Esta tienda no ofrece financiación en cuotas. Por favor, selecciona 1 cuota.'
      };
    }
  }

  // (a) "credit_debit": débito siempre en 1 cuota
  if (type === 'debit_card' && numInstallments > 1) {
    return {
      valid: false,
      message: 'Las tarjetas de débito no admiten pago en cuotas.'
    };
  }

  return { valid: true };
};

/**
 * Devuelve la configuración para el Card Payment Brick de Mercado Pago
 * @param {string} policy 
 */
export const getBrickPolicyConfig = (policy) => {
  switch (policy) {
    case PAYMENT_POLICIES.DEBIT_ONLY:
      return {
        policy,
        maxInstallments: 1,
        excludedPaymentTypes: ['credit_card']
      };
    case PAYMENT_POLICIES.CREDIT_DEBIT_ONE_INSTALLMENT:
      return {
        policy,
        maxInstallments: 1,
        excludedPaymentTypes: []
      };
    case PAYMENT_POLICIES.CREDIT_DEBIT:
    default:
      return {
        policy,
        maxInstallments: 12, // Permite cuotas con interés a cargo del comprador
        excludedPaymentTypes: []
      };
  }
};

