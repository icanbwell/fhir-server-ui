/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_types so do not edit manually

import { TUri } from '../simpleTypes/Uri';
import { TBase64Binary } from '../simpleTypes/Base64Binary';
import { TCanonical } from '../simpleTypes/Canonical';
import { TDate } from '../simpleTypes/Date';
import { TDateTime } from '../simpleTypes/DateTime';
import { TDecimal } from '../simpleTypes/Decimal';
import { TId } from '../simpleTypes/Id';
import { TInstant } from '../simpleTypes/Instant';
import { TInt } from '../simpleTypes/Int';
import { TMarkdown } from '../simpleTypes/Markdown';
import { TOid } from '../simpleTypes/Oid';
import { TTime } from '../simpleTypes/Time';
import { TUnsignedInt } from '../simpleTypes/UnsignedInt';
import { TUrl } from '../simpleTypes/Url';
import { TUuid } from '../simpleTypes/Uuid';
import { TAddress } from '../partials/Address';
import { TQuantity } from '../partials/Quantity';
import { TAnnotation } from '../partials/Annotation';
import { TAttachment } from '../partials/Attachment';
import { TCodeableConcept } from '../partials/CodeableConcept';
import { TCoding } from '../partials/Coding';
import { TContactPoint } from '../partials/ContactPoint';
import { THumanName } from '../partials/HumanName';
import { TIdentifier } from '../partials/Identifier';
import { TMoney } from '../partials/Money';
import { TPeriod } from '../partials/Period';
import { TRange } from '../partials/Range';
import { TRatio } from '../partials/Ratio';
import { TReference } from '../partials/Reference';
import { TSampledData } from '../partials/SampledData';
import { TSignature } from '../partials/Signature';
import { TTiming } from '../partials/Timing';
import { TContactDetail } from '../partials/ContactDetail';
import { TContributor } from '../partials/Contributor';
import { TDataRequirement } from '../partials/DataRequirement';
import { TExpression } from '../partials/Expression';
import { TParameterDefinition } from '../partials/ParameterDefinition';
import { TRelatedArtifact } from '../partials/RelatedArtifact';
import { TTriggerDefinition } from '../partials/TriggerDefinition';
import { TUsageContext } from '../partials/UsageContext';
import { TDosage } from '../partials/Dosage';
import { TMeta } from '../partials/Meta';

export type TExtension = {
    id?: String;
    extension?: TExtension[];
    url?: TUri;
    valueBase64Binary?: TBase64Binary;
    valueBoolean?: Boolean;
    valueCanonical?: TCanonical;
    valueCode?: String;
    valueDate?: TDate;
    valueDateTime?: TDateTime;
    valueDecimal?: TDecimal;
    valueId?: TId;
    valueInstant?: TInstant;
    valueInteger?: TInt;
    valueMarkdown?: TMarkdown;
    valueOid?: TOid;
    valuePositiveInt?: TInt;
    valueString?: String;
    valueTime?: TTime;
    valueUnsignedInt?: TUnsignedInt;
    valueUri?: TUri;
    valueUrl?: TUrl;
    valueUuid?: TUuid;
    valueAddress?: TAddress;
    valueAge?: TQuantity;
    valueAnnotation?: TAnnotation;
    valueAttachment?: TAttachment;
    valueCodeableConcept?: TCodeableConcept;
    valueCoding?: TCoding;
    valueContactPoint?: TContactPoint;
    valueCount?: TQuantity;
    valueDistance?: TQuantity;
    valueDuration?: TQuantity;
    valueHumanName?: THumanName;
    valueIdentifier?: TIdentifier;
    valueMoney?: TMoney;
    valuePeriod?: TPeriod;
    valueQuantity?: TQuantity;
    valueRange?: TRange;
    valueRatio?: TRatio;
    valueReference?: TReference;
    valueSampledData?: TSampledData;
    valueSignature?: TSignature;
    valueTiming?: TTiming;
    valueContactDetail?: TContactDetail;
    valueContributor?: TContributor;
    valueDataRequirement?: TDataRequirement;
    valueExpression?: TExpression;
    valueParameterDefinition?: TParameterDefinition;
    valueRelatedArtifact?: TRelatedArtifact;
    valueTriggerDefinition?: TTriggerDefinition;
    valueUsageContext?: TUsageContext;
    valueDosage?: TDosage;
    valueMeta?: TMeta;
};

