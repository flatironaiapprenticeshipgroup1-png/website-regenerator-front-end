export default interface RegeneratedWebsite {
  RegeneratedWebsiteId: string;
  RegeneratedWebsiteUrl: string;
  CurrentPhase: string;
  CurrentSequence: number;
  CurrentStep: string;
  ErrorMessage: string | null;
  LastUpdatedAt: string;
  RegenerationStatus: string;
  RegenerationTheme: string;
}