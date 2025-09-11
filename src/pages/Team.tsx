import { Layout } from "@/components/Layout";
import InviteManager from "@/components/InviteManager";

export default function Team() {
  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Equipe</h1>
          <p className="text-text-secondary">Gerencie sua equipe e convites</p>
        </div>

        <InviteManager />
      </div>
    </Layout>
  );
}