import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api/admin/order"; // Update if needed

const OrderService = {
  placeOrder: async (orderData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/orders`, orderData);
      return response.data;
    } catch (error) {
      throw error.response?.data || "Error placing order";
    }
  },

  fetchBuyerOrders: async (buyerEmail) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/orders/${buyerEmail}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || "Error fetching buyer orders";
    }
  },

  fetchAllOrders: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/orders`);
      return response.data;
    } catch (error) {
      throw error.response?.data || "Error fetching orders";
    }
  },

  fetchOrderById: async (orderId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/orders/order/${orderId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || "Error fetching order details";
    }
  },

  updatePaymentStatus: async (orderId, newStatus) => {
    try {
      const response = await axios.patch(`${API_BASE_URL}/orders/update-payment`, {
        orderId,
        newStatus,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || "Error updating payment status";
    }
  },

  cancelOrder: async (orderId) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/orders/cancel/${orderId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || "Error canceling order";
    }
  },
};

export default OrderService;
