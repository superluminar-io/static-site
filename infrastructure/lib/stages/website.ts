import { Construct, Stage, StageProps } from "@aws-cdk/core";
import { FrontendStack } from "../stacks/frontend";

export interface WebsiteStageProps extends StageProps {
  domainName: string;
  hostedZoneName: string;
  hostedZoneId: string;
}

export class WebsiteStage extends Stage {
  constructor(scope: Construct, id: string, props: WebsiteStageProps) {
    super(scope, id, props);

    new FrontendStack(this, "FrontendStack", props);
  }
}
