import type { Language } from '../types';

export const translations: Record<Language, {
  appTitle: string;
  appDescription: string;
  newCompetition: {
    title: string;
    description: string;
  };
  savedResults: {
    title: string;
    description: string;
  };
}> = {
  nl: {
    appTitle: 'Hengelsport uitslagen',
    appDescription: 'Selecteer een optie om te beginnen',
    newCompetition: {
      title: 'Nieuwe wedstrijd',
      description: 'Start een nieuwe wedstrijd en voer de details in'
    },
    savedResults: {
      title: 'Uitslagen',
      description: 'Bekijk opgeslagen uitslagen van eerdere wedstrijden'
    }
  },
  en: {
    appTitle: 'Fishing Sport Results',
    appDescription: 'Select an option to begin',
    newCompetition: {
      title: 'New Competition',
      description: 'Start a new competition and enter the details'
    },
    savedResults: {
      title: 'Results',
      description: 'View saved results from previous competitions'
    }
  },
  fr: {
    appTitle: 'Résultats de Pêche Sportive',
    appDescription: 'Sélectionnez une option pour commencer',
    newCompetition: {
      title: 'Nouvelle Compétition',
      description: 'Démarrer une nouvelle compétition et saisir les détails'
    },
    savedResults: {
      title: 'Résultats',
      description: 'Consulter les résultats des compétitions précédentes'
    }
  }
};