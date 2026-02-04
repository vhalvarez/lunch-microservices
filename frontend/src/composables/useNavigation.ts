import { ref } from 'vue';

export type Page = 'dashboard' | 'active-orders' | 'inventory' | 'market' | 'recipes' | 'history' | 'predictions';

const currentPage = ref<Page>('dashboard');

export function useNavigation() {
  function navigateTo(page: Page) {
    currentPage.value = page;
  }

  return {
    currentPage,
    navigateTo
  };
}
