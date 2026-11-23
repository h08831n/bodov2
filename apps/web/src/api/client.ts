import type {
  Contact,
  CreateContactInput,
  UpdateContactInput,
  Product,
  CreateProductInput,
  UpdateProductInput,
  ProductTemplate,
  CreateProductTemplateInput,
  UpdateProductTemplateInput,
  ProductCategory,
  CreateProductCategoryInput,
  ProductAttribute,
  Uom,
  SupplierInfo,
  CreateSupplierInfoInput,
  SaleOrder,
  CreateSaleOrderInput,
  UpdateSaleOrderInput,
  TransitionStageInput,
} from '@bodo/contracts';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

function getActiveDb(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('bodo_active_db') || 'erp_dev';
  }
  return 'erp_dev';
}

function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('bodo_auth_token');
  }
  return null;
}

async function request<T>(path: string, options: RequestInit = {}, customDb?: string): Promise<T> {
  const db = customDb || getActiveDb();
  const token = getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Database': db,
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData: { message?: string; error?: string };
    try {
      errorData = (await response.json()) as { message?: string; error?: string };
    } catch {
      errorData = { message: response.statusText };
    }
    throw new Error(errorData.message || errorData.error || 'خطا در برقراری ارتباط با سرور');
  }

  return response.json();
}

export const api = {
  // Auth
  auth: {
    login: async (database: string, username: string, password: string) => {
      const res = await request<{ accessToken: string; user: { id: string; username: string } }>(
        '/v1/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({ username, password }),
        },
        database,
      );
      if (typeof window !== 'undefined' && res.accessToken) {
        localStorage.setItem('bodo_auth_token', res.accessToken);
        localStorage.setItem('bodo_active_db', database);
      }
      return res;
    },
    logout: async () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('bodo_auth_token');
      }
    },
  },

  // Contacts
  contacts: {
    list: (params?: { type?: string; search?: string }) => {
      const query = new URLSearchParams();
      if (params?.type) query.append('type', params.type);
      if (params?.search) query.append('search', params.search);
      const q = query.toString();
      return request<Contact[]>(`/v1/contacts${q ? `?${q}` : ''}`);
    },
    get: (id: string) => request<Contact>(`/v1/contacts/${id}`),
    create: (data: CreateContactInput) =>
      request<Contact>('/v1/contacts', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: UpdateContactInput) =>
      request<Contact>(`/v1/contacts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/v1/contacts/${id}`, {
        method: 'DELETE',
      }),
  },

  // Products (Odoo 17 Templates, Categories, Attributes, Variants)
  products: {
    // Templates
    listTemplates: (params?: { search?: string; categoryId?: string }) => {
      const query = new URLSearchParams();
      if (params?.search) query.append('search', params.search);
      if (params?.categoryId) query.append('categoryId', params.categoryId);
      const q = query.toString();
      return request<ProductTemplate[]>(`/v1/products/templates${q ? `?${q}` : ''}`);
    },
    getTemplate: (id: string) => request<ProductTemplate>(`/v1/products/templates/${id}`),
    createTemplate: (data: CreateProductTemplateInput) =>
      request<ProductTemplate>('/v1/products/templates', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateTemplate: (id: string, data: UpdateProductTemplateInput) =>
      request<ProductTemplate>(`/v1/products/templates/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    deleteTemplate: (id: string) =>
      request<{ success: boolean }>(`/v1/products/templates/${id}`, {
        method: 'DELETE',
      }),

    // Categories & Attributes
    listCategories: () => request<ProductCategory[]>('/v1/products/categories'),
    createCategory: (data: CreateProductCategoryInput) =>
      request<ProductCategory>('/v1/products/categories', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    listAttributes: () => request<ProductAttribute[]>('/v1/products/attributes'),
    listUoms: () => request<Uom[]>('/v1/products/uoms'),

    // Suppliers
    addSupplier: (data: CreateSupplierInfoInput) =>
      request<SupplierInfo>('/v1/products/suppliers', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    removeSupplier: (id: string) =>
      request<{ success: boolean }>(`/v1/products/suppliers/${id}`, {
        method: 'DELETE',
      }),

    // Variants
    list: (params?: { category?: string; mill?: string; search?: string; templateId?: string }) => {
      const query = new URLSearchParams();
      if (params?.category) query.append('category', params.category);
      if (params?.mill) query.append('mill', params.mill);
      if (params?.search) query.append('search', params.search);
      if (params?.templateId) query.append('templateId', params.templateId);
      const q = query.toString();
      return request<Product[]>(`/v1/products${q ? `?${q}` : ''}`);
    },
    get: (id: string) => request<Product>(`/v1/products/${id}`),
    create: (data: CreateProductInput) =>
      request<Product>('/v1/products', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: UpdateProductInput) =>
      request<Product>(`/v1/products/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/v1/products/${id}`, {
        method: 'DELETE',
      }),
    getMetrics: (id: string) =>
      request<{
        onHandKg: number;
        forecastedKg: number;
        soldQtyKg: number;
        purchasedQtyKg: number;
      }>(`/v1/products/${id}/metrics`),
  },

  // Sales
  sales: {
    list: (params?: { stage?: string; customerId?: string; search?: string }) => {
      const query = new URLSearchParams();
      if (params?.stage) query.append('stage', params.stage);
      if (params?.customerId) query.append('customerId', params.customerId);
      if (params?.search) query.append('search', params.search);
      const q = query.toString();
      return request<SaleOrder[]>(`/v1/sales/quotations${q ? `?${q}` : ''}`);
    },
    get: (id: string) => request<SaleOrder>(`/v1/sales/quotations/${id}`),
    create: (data: CreateSaleOrderInput) =>
      request<SaleOrder>('/v1/sales/quotations', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: UpdateSaleOrderInput) =>
      request<SaleOrder>(`/v1/sales/quotations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    transitionStage: (id: string, data: TransitionStageInput) =>
      request<SaleOrder>(`/v1/sales/quotations/${id}/transition`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Databases
  databases: {
    list: () => request<{ databases: Array<{ name: string; status: string }> }>('/v1/databases'),
  },
};
